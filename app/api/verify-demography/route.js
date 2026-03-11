import { NextResponse } from 'next/server';
import { getMockByDemography, mockUsers } from '@/lib/mockData';

export async function POST(request) {
    try {
        const body = await request.json();
        const { firstname, lastname, dob } = body;

        console.log(`[API] Verifying NIN via Demography: ${firstname} ${lastname} (DB Bypass active)`);

        if (!firstname || !lastname || !dob) {
            return NextResponse.json(
                { error: 'First name, last name, and Date of Birth are required.' },
                { status: 400 }
            );
        }

        const user = getMockByDemography(firstname, lastname, dob) || mockUsers[0];

        return NextResponse.json({
            success: true,
            status: 'VALID',
            user: {
                nin: user.nin || '12345678901',
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
        console.error('Verify Demography API error:', err);
        return NextResponse.json(
            { error: 'An error occurred during demographic verification.' },
            { status: 500 }
        );
    }
}
