import { createServiceClient } from './lib/supabase/server';

async function test() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('timetable_slots')
    .select('count', { count: 'exact', head: true });

  console.log('Slots Count:', data?.[0]?.count || 0);
  if (error) console.error('Error:', error);

  const { data: slots } = await supabase.from('timetable_slots').select('*').limit(5);

  console.log('Sample Slots:', JSON.stringify(slots, null, 2));
}

test();
