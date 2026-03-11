import { NextResponse } from 'next/server';
import { getMockByTrackingId, mockUsers } from '@/lib/mockData';

export async function POST(request) {
    try {
        const body = await request.json();
        const { tracking_id } = body;

        console.log(`[API] Verifying NIN via Tracking ID: ${tracking_id} (DB Bypass active)`);

        if (!tracking_id || tracking_id.length < 5) {
            return NextResponse.json(
                { error: 'Invalid Tracking ID format.' },
                { status: 400 }
            );
        }

        const user = getMockByTrackingId(tracking_id) || mockUsers[0];

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
        console.error('Verify API error:', err);
        return NextResponse.json(
            { error: 'An error occurred during tracking ID verification.' },
            { status: 500 }
        );
    }
}
