import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { adminAuth } from '@/lib/auth/adminAuth';

// GET: Get a setting by key or all settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const category = searchParams.get('category');
    const includeCounts = searchParams.get('include_counts') === 'true';

    const supabase = createServiceClient();

    let query = supabase.from('settings').select('*');

    if (key) {
      query = query.eq('key', key);
    }
    if (category) {
      query = query.eq('category', category);
    }

    const { data: dbSettings, error } = await query;
    if (error) throw error;

    // Map database settings to key-value
    const settingsMap: Record<string, any> = {};
    dbSettings?.forEach((item) => {
      settingsMap[item.key] = {
        value: item.value,
        value_json: item.value_json,
        description: item.description,
        category: item.category,
        is_public: item.is_public,
      };
    });

    // Add defaults if they are missing
    const defaults = getDefaultSettings(key, category);
    const result: Record<string, any> = {};

    // Merge defaults
    for (const [k, v] of Object.entries(defaults)) {
      result[k] = settingsMap[k] || {
        value: v,
        value_json: null,
        category:
          k === 'academic_year' || k === 'semester' || k === 'grading_scale'
            ? 'academic'
            : 'school',
        is_public: true,
      };
    }

    // Add any database-only settings (like custom rooms or schedules)
    dbSettings?.forEach((item) => {
      if (!result[item.key]) {
        result[item.key] = {
          value: item.value,
          value_json: item.value_json,
          description: item.description,
          category: item.category,
          is_public: item.is_public,
        };
      }
    });

    // Compute slot counts if requested
    let slotCounts:
      | {
          rooms: Record<string, number>;
          schedules: Record<string, number>;
          branches: Record<string, number>;
        }
      | undefined;
    if (includeCounts) {
      const { data: slots, error: slotsError } = await supabase
        .from('timetable_slots')
        .select('room, start_time, end_time');

      if (!slotsError && slots) {
        const roomsMap: Record<string, number> = {};
        const schedulesMap: Record<string, number> = {};
        const branchesMap: Record<string, number> = {};

        slots.forEach((slot) => {
          if (slot.room) {
            const parts = slot.room.split(' - ');
            if (parts.length === 2) {
              const branch = parts[0].trim();
              const room = parts[1].trim();
              branchesMap[branch] = (branchesMap[branch] || 0) + 1;
              roomsMap[room] = (roomsMap[room] || 0) + 1;
            } else {
              const room = slot.room.trim();
              roomsMap[room] = (roomsMap[room] || 0) + 1;
            }
          }

          if (slot.start_time && slot.end_time) {
            const start = slot.start_time.substring(0, 5);
            const end = slot.end_time.substring(0, 5);
            const sched = `${start} - ${end}`;
            schedulesMap[sched] = (schedulesMap[sched] || 0) + 1;
          }
        });

        slotCounts = {
          rooms: roomsMap,
          schedules: schedulesMap,
          branches: branchesMap,
        };
      }
    }

    // If a specific key was requested and it's not found in result, return 404
    if (key) {
      const single = result[key];
      if (!single) {
        return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, setting: { key, ...single } });
    }

    return NextResponse.json({ success: true, settings: result, slotCounts });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT: Update a setting (admin only)
export async function PUT(request: NextRequest) {
  try {
    // Use the centralized adminAuth helper which supports super_admin via inheritance
    const auth = await adminAuth(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.reason || 'Admin access required' },
        {
          status: auth.authorized === false && auth.userId ? 403 : 401,
        }
      );
    }

    const supabase = createServiceClient();

    const body = await request.json();
    const { key, value, value_json, description, category, is_public } = body;

    if (!key) {
      return NextResponse.json(
        { error: 'Key is required' },
        {
          status: 400,
        }
      );
    }

    const { data, error } = await supabase
      .from('settings')
      .upsert(
        {
          key,
          value: typeof value === 'string' ? value : null,
          value_json: typeof value === 'object' ? value : value_json || null,
          description,
          category: category || 'general',
          is_public: is_public ?? false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, setting: data });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
}

// Helper function to get default settings
function getDefaultSettings(key?: string | null, category?: string | null): Record<string, string> {
  const defaults: Record<string, { value: string; category: string }> = {
    school_name: {
      value: 'TRUNG TÂM GIÁO DỤC BÙI HOÀNG',
      category: 'school',
    },
    school_name_short: { value: 'BH-EDU', category: 'school' },
    school_address: { value: '', category: 'school' },
    school_phone: { value: '', category: 'school' },
    school_email: { value: '', category: 'school' },
    school_website: { value: '', category: 'school' },
    school_logo_url: { value: '/logo.png', category: 'school' },
    academic_year: { value: '2026-2027', category: 'academic' },
    semester: { value: '1', category: 'academic' },
    grading_scale: { value: '10', category: 'academic' },
  };

  const result: Record<string, string> = {};

  for (const [k, v] of Object.entries(defaults)) {
    if (key && k !== key) continue;
    if (category && v.category !== category) continue;
    result[k] = v.value;
  }

  return result;
}
