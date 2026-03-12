import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client using the Service Role key.
 * This bypasses Row Level Security (RLS) and should ONLY be used in:
 * - API routes (server-side)
 * - Webhook handlers
 * - Server actions
 * 
 * NEVER expose this to the client/browser.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey) {
    console.warn('[Supabase Admin] SUPABASE_SERVICE_ROLE_KEY is missing! Webhook writes will fail due to RLS.');
}

export const supabaseAdmin = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseServiceRoleKey || 'placeholder',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        }
    }
);
