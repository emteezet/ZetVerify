import { NextResponse } from 'next/server';
import { supabase } from '@/src/lib/supabase/client';
import { generatePDF } from '@/lib/utils/generatePDF';
import { generatePremiumPDF } from '@/lib/utils/generatePremiumPDF';
import { generateQR } from '@/lib/utils/generateQR';

export async function POST(request) {
    try {
        const body = await request.json();
        const { query, slipType } = body;

        // Validate input
        if (!query || typeof query !== 'string') {
            return NextResponse.json(
                { error: 'Please provide a NIN or phone number.' },
                { status: 400 }
            );
        }

        const sanitized = query.trim();

        // Determine search filter
        let filter = '';
        if (/^\d{11}$/.test(sanitized)) {
            filter = `nin.eq.${sanitized},phone.eq.${sanitized}`;
        } else if (/^0\d{10}$/.test(sanitized)) {
            filter = `phone.eq.${sanitized}`;
        } else {
            return NextResponse.json(
                { error: 'Invalid input. NIN must be 11 digits. Phone must be 11 digits starting with 0.' },
                { status: 400 }
            );
        }

        // DB Bypass: Fetch from mock data instead of Supabase Registry
        let user = null;
        if (process.env.NODE_ENV === 'development') {
            const { getMockByNin, getMockByPhone, mockUsers } = require('@/lib/mockData');
            user = getMockByNin(sanitized) || getMockByPhone(sanitized) || mockUsers[0];
            console.log(`[API] Generation for: ${sanitized} (DB Bypass active, using ${user.firstName})`);
        } else {
            const { data, error: userError } = await supabase
                .from('registry')
                .select('*')
                .or(filter)
                .single();

            if (userError || !data) {
                console.error('Registry lookup error:', userError);
                return NextResponse.json(
                    { error: 'Record not found. Please check your NIN or phone number.' },
                    { status: 404 }
                );
            }
            user = data;
        }

        // Generate QR code as data URL
        const qrCode = await generateQR(user.nin || sanitized);

        // Map user properties if they came from mock data (camelCase vs snake_case)
        const formattedUser = {
            nin: user.nin || sanitized,
            phone: user.phone,
            first_name: user.firstName || user.first_name,
            last_name: user.lastName || user.last_name,
            middle_name: user.middleName || user.middle_name || '',
            dob: user.dob,
            gender: user.gender,
            state: user.state,
            lga: user.lga,
            photo: user.photo
        };

        // Generate PDF based on slipType
        let pdfBuffer, serialNumber;

        if (slipType === 'premium') {
            const result = await generatePremiumPDF(formattedUser);
            pdfBuffer = result.buffer;
            serialNumber = result.serialNumber;
        } else {
            const result = await generatePDF(formattedUser);
            pdfBuffer = result.buffer;
            serialNumber = result.serialNumber;
        }

        // Track the slip generation in Supabase (Skip in dev if no DB)
        if (process.env.NODE_ENV !== 'development') {
            const { error: slipError } = await supabase
                .from('slips')
                .insert({
                    nin: user.nin || sanitized,
                    serial_number: serialNumber,
                });

            if (slipError) {
                console.error('Slip tracking error:', slipError);
            }
        }

        // Convert PDF buffer to base64
        const pdfBase64 = pdfBuffer.toString('base64');

        // Format user for frontend
        const userData = {
            nin: user.nin,
            phone: user.phone,
            firstName: user.first_name,
            lastName: user.last_name,
            middleName: user.middle_name || '',
            dob: user.dob,
            gender: user.gender,
            state: user.state,
            lga: user.lga,
            photo: user.photo,
        };

        return NextResponse.json({
            success: true,
            user: userData,
            qrCode,
            pdf: pdfBase64,
            serialNumber,
            generatedAt: new Date().toISOString(),
        });
    } catch (err) {
        console.error('Generate API error:', err);
        return NextResponse.json(
            { error: 'An error occurred while generating the slip. Please try again.' },
            { status: 500 }
        );
    }
}
