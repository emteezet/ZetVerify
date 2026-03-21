import { NextResponse } from 'next/server';
import { identityService } from '@/services/IdentityService';
import { authenticateRequest } from '@/lib/utils/auth';

export async function POST(request) {
    console.log('[API Verify] Request started');
    try {
        const body = await request.json();
        const { nin } = body;

        // Strict validation: exactly 11 numeric digits
        if (!nin || !/^\d{11}$/.test(nin)) {
            return NextResponse.json(
                { error: 'Invalid input. NIN must be exactly 11 numeric digits.' },
                { status: 400 }
            );
        }

        // ── 1. Authenticate the request ──────────────────────────────────
        const { user: authUser, error: authErrorMsg } = await authenticateRequest(request);

        if (!authUser) {
            return NextResponse.json(
                { error: authErrorMsg || 'Session expired. Please log in again.' },
                { status: 401 }
            );
        }

        // ── 2. Call IdentityService (Handles Debit + Registry Lookup) ──
        try {
            const result = await identityService.verifyNin(authUser.id, nin);
            
            return NextResponse.json({
                success: true,
                status: result.status || 'VALID',
                user: result.data,
                generatedAt: new Date().toISOString()
            });

        } catch (err) {
            console.error('[API Verify] Error object:', JSON.stringify(err, null, 2));
            console.error('[API Verify] Error message:', err.message);
            // Handle Insufficient Balance
            if (err.message?.toLowerCase().includes('insufficient') || err.code === 'INSUFFICIENT_BALANCE') {
                return NextResponse.json(
                    {
                        error: `Insufficient wallet balance. You need at least ₦150 to verify a NIN.`,
                        code: 'INSUFFICIENT_BALANCE',
                    },
                    { status: 402 }
                );
            }

            // Handle Not Found
            if (err.code === 'IDENTITY_NOT_FOUND' || err.message?.includes('not found')) {
                return NextResponse.json(
                    { error: 'NIN record not found in the official registry.' },
                    { status: 404 }
                );
            }

            throw err; // Pass to main catch block
        }

    } catch (err) {
        console.error('Verify API error:', err);
        return NextResponse.json(
            { error: err.message || 'An error occurred during verification.' },
            { status: err.status || 500 }
        );
    }
}
