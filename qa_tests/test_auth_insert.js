import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://ynkhukeqdqewakrqtvtu.supabase.co', 'sb_publishable_Uq2GNNl4Oj3PcWWRJpIUiQ_ew0XiUoX');

async function testInsertWithAuth() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'donor.hs001@gmail.com',
    password: 'Password123!'
  });
  console.log('SignIn:', authData?.user?.id, authError?.message);

  if (authData?.user) {
    const prof = await supabase.from('profiles').insert([{
      auth_user_id: authData.user.id,
      legacy_user_id: 'HS001',
      full_name: 'Trần Bảo An',
      role: 'student',
      class: '7/1',
      shift: 'Sáng'
    }]);
    console.log('Insert profile:', prof.error?.message || 'SUCCESS');

    const u = await supabase.from('users').insert([{
      id: 'HS001',
      name: 'Trần Bảo An',
      role: 'student',
      class: '7/1',
      shift: 'Sáng'
    }]);
    console.log('Insert user:', u.error?.message || 'SUCCESS');
  }
}
testInsertWithAuth();
