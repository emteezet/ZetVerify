import { NextResponse } from 'next/server';
import { mockUserProfile } from '@/lib/mockData';

export async function POST(request) {
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

        // MOCK MODE: If in development, return mock user profile
        if (process.env.NODE_ENV === 'development') {
            console.log('MOCK MODE: Returning development mock profile for NIN', nin);

            const { getMockByNin, mockUsers } = require('@/lib/mockData');
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
                generatedAt: new Date().toISOString()
            });
        }

        // TODO: Real API Integration (Mono/Smile ID) for production
        // For now, return an error if not in dev mode and integration is pending
        return NextResponse.json(
            { error: 'Production API integration is pending. Use development mode for testing.' },
            { status: 503 }
        );

    } catch (err) {
        console.error('Verify API error:', err);
        return NextResponse.json(
            { error: 'An error occurred during verification.' },
            { status: 500 }
        );
    }
}
