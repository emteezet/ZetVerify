import { NextResponse } from 'next/server';
import { getMockByPhone, mockUsers } from '@/lib/mockData';

export async function POST(request) {
    try {
        const body = await request.json();
        const { phone } = body;

        console.log(`[API] Verifying BVN Phone: ${phone} (DB Bypass active)`);

        if (!phone || !/^\d{11}$/.test(phone)) {
            return NextResponse.json(
                { error: 'Invalid phone number format. Must be 11 numeric digits.' },
                { status: 400 }
            );
        }

        const user = getMockByPhone(phone) || mockUsers.find(u => u.phone) || mockUsers[0];

        return NextResponse.json({
            success: true,
            status: 'VALID',
            user: {
                bvn: user.bvn || user.nin || '22222333333',
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
        console.error('Verify BVN Phone API error:', err);
        return NextResponse.json(
            { error: 'An error occurred during BVN phone verification.' },
            { status: 500 }
        );
    }
}
