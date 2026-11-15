import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://ynkhukeqdqewakrqtvtu.supabase.co', 'sb_publishable_Uq2GNNl4Oj3PcWWRJpIUiQ_ew0XiUoX');

async function probe() {
  const tables = ['users', 'items', 'requests', 'appointments', 'logs', 'notifications', 'station_slots', 'storage_assignments'];
  for (const t of tables) {
    const sel = await supabase.from(t).select('*').limit(1);
    console.log(`Table ${t} SELECT: status=${sel.status}, count=${sel.data?.length}, error=${sel.error?.message || 'NONE'}`);
  }
}
probe();
