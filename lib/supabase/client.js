import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            lock: (name) => ({
                acquire: async () => ({ release: () => { } }),
                release: async () => { }
            })
        },
        global: {
            fetch: async (...args) => {
                if (typeof window === 'undefined') {
                    const { httpsFetch } = await import('../utils/httpsFetch');
                    return httpsFetch(...args);
                }
                return fetch(...args);
            }
        }
    }
);
