import { NextResponse } from 'next/server';
import { identityService } from '@/services/IdentityService';
import { authenticateRequest } from '@/lib/utils/auth';
const { decryptIdentity } = require('@/lib/crypto/encryption');


export async function POST(request) {
    console.log('[API Verify NIN Phone] Request started');
    try {
        const body = await request.json();
        const { phone } = body;

        // Strict validation: exactly 11 numeric digits
        if (!phone || !/^\d{11}$/.test(phone)) {
            return NextResponse.json(
                { error: 'Invalid input. Phone number must be exactly 11 numeric digits.' },
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
            const result = await identityService.verifyByNinPhone(authUser.id, phone);
            
            // Decrypt the result for the frontend display, but keep encrypted for navigation
            if (result.data && (result.data.nin || result.data.bvn)) {
                const rawVal = result.data.nin || result.data.bvn;
                result.data.fullNin = encodeURIComponent(rawVal); // Keep encrypted + URI safe
                if (result.data.nin) result.data.nin = decryptIdentity(result.data.nin);
                if (result.data.bvn) result.data.bvn = decryptIdentity(result.data.bvn);
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
                        error: `Insufficient wallet balance. You need at least ₦150 to verify a NIN record by phone.`,
                        code: 'INSUFFICIENT_BALANCE',
                    },
                    { status: 402 }
                );
            }

            // Handle Not Found
            if (err.code === 'IDENTITY_NOT_FOUND' || err.message?.toLowerCase().includes('not found')) {
                return NextResponse.json(
                    { error: 'NIN record not found for this phone number in the official registry.' },
                    { status: 404 }
                );
            }

            throw err; // Pass to main catch block
        }

    } catch (err) {
        console.error('Verify NIN Phone API error:', err);
        return NextResponse.json(
            { error: err.message || 'An error occurred during verification.' },
            { status: err.status || 500 }
        );
    }
}
