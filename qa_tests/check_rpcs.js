import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://ynkhukeqdqewakrqtvtu.supabase.co', 'sb_publishable_Uq2GNNl4Oj3PcWWRJpIUiQ_ew0XiUoX');

async function testRpc() {
  const rpcs = [
    'rpc_get_my_dropoff_schedules',
    'rpc_accept_request_by_donor',
    'rpc_inspect_and_receive_item',
    'rpc_complete_handover'
  ];
  for (const r of rpcs) {
    const res = await supabase.rpc(r);
    console.log(`RPC ${r}: status=${res.status}, error=${res.error?.message || 'NONE'}, code=${res.error?.code}`);
  }
}
testRpc();
