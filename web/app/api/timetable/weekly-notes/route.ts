import { createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = createServiceClient();
        const { searchParams } = new URL(request.url);
        const slotId = searchParams.get('slot_id');
        const weekStartDate = searchParams.get('week_start_date');

        if (!slotId || !weekStartDate) {
            return NextResponse.json(
                { success: false, error: 'Missing slot_id or week_start_date' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('weekly_notes')
            .select('*')
            .eq('slot_id', slotId)
            .eq('week_start_date', weekStartDate)
            .maybeSingle();

        if (error) throw error;

        return NextResponse.json({ success: true, note: data });
    } catch (error) {
        console.error('Error fetching weekly note:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch weekly note' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = createServiceClient();
        const body = await request.json();
        const { slot_id, week_start_date, notes } = body;

        if (!slot_id || !week_start_date) {
            return NextResponse.json(
                { success: false, error: 'Missing slot_id or week_start_date' },
                { status: 400 }
            );
        }

        // Upsert: insert or update if exists
        const { data, error } = await supabase
            .from('weekly_notes')
            .upsert(
                {
                    slot_id,
                    week_start_date,
                    notes,
                    updated_at: new Date().toISOString()
                },
                {
                    onConflict: 'slot_id,week_start_date'
                }
            )
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, note: data });
    } catch (error) {
        console.error('Error saving weekly note:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to save weekly note' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = createServiceClient();
        const { searchParams } = new URL(request.url);
        const slotId = searchParams.get('slot_id');
        const weekStartDate = searchParams.get('week_start_date');

        if (!slotId || !weekStartDate) {
            return NextResponse.json(
                { success: false, error: 'Missing slot_id or week_start_date' },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('weekly_notes')
            .delete()
            .eq('slot_id', slotId)
            .eq('week_start_date', weekStartDate);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting weekly note:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete weekly note' },
            { status: 500 }
        );
    }
}
