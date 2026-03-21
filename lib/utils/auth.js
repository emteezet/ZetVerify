import { httpsFetch } from './httpsFetch';

/**
 * Authenticates a request by verifying the Supabase session token.
 * Uses httpsFetch (which forces IPv4) to avoid DNS resolution issues.
 * 
 * @param {Request} request - The incoming Next.js request
 * @returns {{ user: object|null, error: string|null }}
 */
export async function authenticateRequest(request) {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (!token) {
        return { user: null, error: 'Unauthorized. Please log in to verify.' };
    }

    try {
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
