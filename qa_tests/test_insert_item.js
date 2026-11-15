import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://ynkhukeqdqewakrqtvtu.supabase.co', 'sb_publishable_Uq2GNNl4Oj3PcWWRJpIUiQ_ew0XiUoX');

async function testInsertItem() {
  const testItem = {
    id: 'ITEM-TEST-QA-001',
    title: '[TEST-QA] Sách Thử Nghiệm',
    category: 'Sách giáo khoa',
    condition: 'Tốt',
    description: 'Thử nghiệm ghi dữ liệu',
    donor_id: 'HS001',
    donor_name: 'Trần Bảo An',
    donor_class: '7/1',
    available_slots: ['Thứ 2 - Chiều'],
    status: 'pending',
    request_status: 'open',
    likes_count: 0
  };

  const { data, error } = await supabase.from('items').insert([testItem]);
  console.log('Result insert:', { data, error });
}
testInsertItem();
