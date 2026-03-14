import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/admin';
import { validateAdminSession, unauthorizedAdminResponse } from '@/lib/auth/admin';

export async function GET(request) {
    if (!await validateAdminSession(request)) return unauthorizedAdminResponse();
    try {
        // Get total users in registry
        const { count: totalUsers, error: userCountError } = await supabase
            .from('registry')
            .select('*', { count: 'exact', head: true });

        if (userCountError) throw userCountError;

        // Get total slips generated
        const { count: totalSlips, error: slipCountError } = await supabase
            .from('slips')
            .select('*', { count: 'exact', head: true });

        if (slipCountError) throw slipCountError;

        // Get recent slips
        const { data: recentSlips, error: recentError } = await supabase
            .from('slips')
            .select('*')
            .order('generated_at', { ascending: false })
            .limit(10);

        if (recentError) throw recentError;

        // Get slips per user (NIN)
        // Note: Supabase/PostgREST doesn't support aggregate directly in one call like Mongo's $group
        // For a school project simulation, we'll return the raw stats available.
        // A real implementation would use a SQL function or RPC.

        return NextResponse.json({
            success: true,
            stats: {
                totalUsers: totalUsers || 0,
                totalSlips: totalSlips || 0,
                recentSlips: recentSlips.map((s) => ({
                    nin: s.nin,
                    serialNumber: s.serial_number,
                    generatedAt: s.generated_at,
                })),
                topUsers: [], // Optional: implement via RPC if needed
            },
        });
    } catch (err) {
        console.error('Admin stats error:', err);
        return NextResponse.json({ error: 'Failed to fetch stats.' }, { status: 500 });
    }
}
