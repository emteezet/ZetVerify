import { NextResponse } from 'next/server';
import { getMockByNin, mockUsers } from '@/lib/mockData';

export async function GET(request, { params }) {
    try {
        // In Next.js 15+, params is a promise
        const resolvedParams = await params;
        const { nin } = resolvedParams;

        console.log(`[API] Verifying NIN: ${nin} (DB Bypass active)`);

        // Validate NIN format
        if (!nin || !/^\d{11}$/.test(nin)) {
            return NextResponse.json(
                { error: 'Invalid NIN format. Must be 11 digits.' },
                { status: 400 }
            );
        }

        // DB Bypass: Fetch from mock data instead of Supabase Registry
        // Fallback to first mock user if not found to ensure "fetch successfully even if its wrong"
        const user = getMockByNin(nin) || mockUsers[0];

        return NextResponse.json({
            success: true,
            status: 'VALID',
            user: {
                nin: user.nin || nin,
                firstName: user.firstName,
                lastName: user.lastName,
                middleName: user.middleName || '',
                dob: user.dob,
                gender: user.gender,
                state: user.state,
                lga: user.lga,
                photo: user.photo,
            },
            lastGenerated: new Date().toISOString(),
            serialNumber: "MOCK-" + Math.random().toString(36).substring(7).toUpperCase(),
        });
    } catch (err) {
        console.error('Verify API error:', err);
        return NextResponse.json(
            { error: 'An error occurred during verification.' },
            { status: 500 }
        );
    }
}
