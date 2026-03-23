import { httpsFetch } from './httpsFetch';
import { createClient } from '../supabase/server';

/**
 * Authenticates a request by verifying the Supabase session.
 * Supports both Cookie-based (SSR) and Header-based (Bearer Token) authentication.
 * 
 * @param {Request} request - The incoming Next.js request
 * @returns {{ user: object|null, error: string|null }}
 */
export async function authenticateRequest(request) {
    try {
        // 1. Try Cookie-based authentication (SSR)
        const supabase = await createClient();
        const { data: { user }, error: cookieError } = await supabase.auth.getUser();

        if (user && !cookieError) {
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    user_metadata: user.user_metadata
                },
                error: null
            };
        }

        // 2. Fallback to Header-based authentication (Bearer Token)
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

        if (!token) {
            return { user: null, error: 'Unauthorized. Please log in.' };
        }

        const authUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`;
        const authRes = await httpsFetch(authUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            },
            timeout: 10000
        });

        const json = await authRes.json();

        if (authRes.ok) {
            return { user: json, error: null };
        } else {
            return { user: null, error: json.msg || json.message || 'Auth failed' };
        }
    } catch (err) {
        console.error('[Auth] Auth check failure:', err.message);
        return { user: null, error: `Auth service unreachable: ${err.message}` };
    }
}
