import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://ynkhukeqdqewakrqtvtu.supabase.co', 'sb_publishable_Uq2GNNl4Oj3PcWWRJpIUiQ_ew0XiUoX');

async function testSignUp() {
  const { data, error } = await supabase.auth.signUp({
    email: 'pilot.donor@leloiloop.test',
    password: 'Password123!'
  });
  console.log('SignUp result:', { user: data?.user?.id, error: error?.message });
}
testSignUp();
