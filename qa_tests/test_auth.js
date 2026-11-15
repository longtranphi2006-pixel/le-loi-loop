import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://ynkhukeqdqewakrqtvtu.supabase.co', 'sb_publishable_Uq2GNNl4Oj3PcWWRJpIUiQ_ew0XiUoX');

async function testAuth() {
  const emails = [
    'pilot.donor@leloiloop.test',
    'pilot.requester@leloiloop.test',
    'pilot.station@leloiloop.test',
    'pilot.teacher@leloiloop.test'
  ];
  for (const email of emails) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: 'Password123!'
    });
    console.log(`Login ${email}:`, error?.message || 'SUCCESS');
  }
}
testAuth();
