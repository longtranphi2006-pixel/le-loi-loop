import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://ynkhukeqdqewakrqtvtu.supabase.co', 'sb_publishable_Uq2GNNl4Oj3PcWWRJpIUiQ_ew0XiUoX');

async function probeInserts() {
  // Test users
  const u = await supabase.from('users').insert([{ id: 'TEST_U', name: 'Test' }]);
  console.log('users insert:', u.status, u.error?.code, u.error?.message);

  // Test items without donor_id
  const i = await supabase.from('items').insert([{
    id: 'ITEM-TEST-ANON',
    title: '[TEST-QA] Anon Item',
    category: 'Sách giáo khoa',
    condition: 'Tốt',
    status: 'pending',
    request_status: 'open'
  }]);
  console.log('items insert (donor_id: null):', i.status, i.error?.code, i.error?.message);

  if (!i.error) {
    await supabase.from('items').delete().eq('id', 'ITEM-TEST-ANON');
    console.log('items delete test passed!');
  }

  // Test requests without item_id
  const r = await supabase.from('requests').insert([{
    id: 'REQ-TEST-ANON',
    requester_name: 'Test',
    reason: 'Test',
    status: 'pending'
  }]);
  console.log('requests insert:', r.status, r.error?.code, r.error?.message);
  if (!r.error) {
    await supabase.from('requests').delete().eq('id', 'REQ-TEST-ANON');
  }

  // Test logs
  const l = await supabase.from('logs').insert([{
    id: 'LOG-TEST-ANON',
    role: 'tester',
    action: 'TEST',
    details: 'Probe insert'
  }]);
  console.log('logs insert:', l.status, l.error?.code, l.error?.message);
  if (!l.error) {
    await supabase.from('logs').delete().eq('id', 'LOG-TEST-ANON');
  }

  // Test notifications
  const n = await supabase.from('notifications').insert([{
    id: 'NOTIF-TEST-ANON',
    title: 'Test',
    message: 'Test'
  }]);
  console.log('notifications insert:', n.status, n.error?.code, n.error?.message);
}
probeInserts();
