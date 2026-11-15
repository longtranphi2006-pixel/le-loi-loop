import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://ynkhukeqdqewakrqtvtu.supabase.co', 'sb_publishable_Uq2GNNl4Oj3PcWWRJpIUiQ_ew0XiUoX');

async function check() {
  const [u, i, r, a] = await Promise.all([
    supabase.from('users').select('id, name, role'),
    supabase.from('items').select('id, title, status'),
    supabase.from('requests').select('id, item_id, requester_id, status'),
    supabase.from('appointments').select('id, item_id, status')
  ]);
  console.log('Users count:', u.data?.length, u.data);
  console.log('Items count:', i.data?.length, i.data);
  console.log('Requests count:', r.data?.length);
  console.log('Appointments count:', a.data?.length);
}
check();
