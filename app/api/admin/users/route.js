import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// GET — List all registry users
export async function GET() {
    try {
        const { data: users, error } = await supabase
            .from('registry')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const sanitized = users.map((u) => ({
            id: u.id,
            nin: u.nin,
            phone: u.phone,
            firstName: u.first_name,
            lastName: u.last_name,
            middleName: u.middle_name || '',
            gender: u.gender,
            state: u.state,
            lga: u.lga,
            dob: u.dob,
            photo: u.photo,
            createdAt: u.created_at,
        }));

        return NextResponse.json({ success: true, users: sanitized });
    } catch (err) {
        console.error('Admin users GET error:', err);
        return NextResponse.json({ error: 'Failed to fetch users.' }, { status: 500 });
    }
}

// POST — Add new registry user
export async function POST(request) {
    try {
        const body = await request.json();

        // Validate required fields
        const required = ['nin', 'phone', 'firstName', 'lastName', 'dob', 'gender', 'state', 'lga'];
        for (const field of required) {
            if (!body[field]) {
                return NextResponse.json(
                    { error: `Missing required field: ${field}` },
                    { status: 400 }
                );
            }
        }

        // Check NIN format
        if (!/^\d{11}$/.test(body.nin)) {
            return NextResponse.json(
                { error: 'NIN must be exactly 11 digits.' },
                { status: 400 }
            );
        }

        // Check if NIN already exists in Registry
        const { data: existing } = await supabase
            .from('registry')
            .select('id')
            .eq('nin', body.nin)
            .maybeSingle();

        if (existing) {
            return NextResponse.json(
                { error: 'A user with this NIN already exists.' },
                { status: 409 }
            );
        }

        const { data: user, error } = await supabase
            .from('registry')
            .insert({
                nin: body.nin,
                phone: body.phone,
                first_name: body.firstName,
                last_name: body.lastName,
                middle_name: body.middleName || '',
                dob: body.dob,
                gender: body.gender,
                state: body.state,
                lga: body.lga,
                photo: body.photo || '/uploads/default-avatar.png',
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                nin: user.nin,
                firstName: user.first_name,
                lastName: user.last_name,
            },
        }, { status: 201 });
    } catch (err) {
        console.error('Admin users POST error:', err);
        return NextResponse.json({ error: 'Failed to create user.' }, { status: 500 });
    }
}

// DELETE — Remove registry user by ID
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
        }

        const { error } = await supabase
            .from('registry')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'User deleted.' });
    } catch (err) {
        console.error('Admin users DELETE error:', err);
        return NextResponse.json({ error: 'Failed to delete user.' }, { status: 500 });
    }
}
