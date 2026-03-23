import { NextResponse } from 'next/server';
import { identityService } from '@/services/IdentityService';
import { authenticateRequest } from '@/lib/utils/auth';
const { decryptIdentity } = require('@/lib/crypto/encryption');


export async function POST(request) {
    console.log('[API Verify BVN] Request started');
    try {
        const body = await request.json();
        const { bvn } = body;

        // Strict validation: exactly 11 numeric digits
        if (!bvn || !/^\d{11}$/.test(bvn)) {
            return NextResponse.json(
                { error: 'Invalid input. BVN must be exactly 11 numeric digits.' },
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
            const result = await identityService.verifyBvn(authUser.id, bvn);
            
            // Decrypt the result for the frontend display, but keep encrypted for navigation
            if (result.data && (result.data.bvn || result.data.nin)) {
                const rawVal = result.data.bvn || result.data.nin;
                result.data.fullNin = encodeURIComponent(rawVal); // Keep encrypted + URI safe
                if (result.data.bvn) result.data.bvn = decryptIdentity(result.data.bvn);
                if (result.data.nin) result.data.nin = decryptIdentity(result.data.nin);
            }

            return NextResponse.json({
                success: true,
                status: result.status || 'VALID',
                user: result.data,
                generatedAt: new Date().toISOString()
            });

        } catch (err) {
            // Handle Insufficient Balance
            if (err.message?.toLowerCase().includes('insufficient') || err.code === 'INSUFFICIENT_BALANCE') {
                return NextResponse.json(
                    {
                        error: `Insufficient wallet balance. You need at least ₦100 to verify a BVN record.`,
                        code: 'INSUFFICIENT_BALANCE',
                    },
                    { status: 402 }
                );
            }

            // Handle Not Found
            if (err.code === 'IDENTITY_NOT_FOUND' || err.message?.toLowerCase().includes('not found')) {
                return NextResponse.json(
                    { error: 'BVN record not found in the official registry.' },
                    { status: 404 }
                );
            }

            throw err; // Pass to main catch block
        }

    } catch (err) {
        console.error('Verify BVN API error:', err);
        return NextResponse.json(
            { error: err.message || 'An error occurred during verification.' },
            { status: err.status || 500 }
        );
    }
}
