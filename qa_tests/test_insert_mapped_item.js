import { createClient } from '@supabase/supabase-js';
import { mapItemToDb } from '../src/lib/supabase.js';

const supabase = createClient('https://ynkhukeqdqewakrqtvtu.supabase.co', 'sb_publishable_Uq2GNNl4Oj3PcWWRJpIUiQ_ew0XiUoX');

async function testInsertMappedItem() {
  const itemObj = {
    id: 'ITEM-TEST-QA-001',
    title: '[TEST-QA] Sách Thử Nghiệm',
    category: 'Sách giáo khoa',
    condition: 'Tốt',
    description: 'Thử nghiệm ghi dữ liệu',
    donorId: 'HS001',
    donorName: 'Trần Bảo An',
    availableSlots: ['Thứ 2 - Chiều', 'Thứ 4 - Sáng'],
    inputMethod: 'website',
    status: 'pending',
    requestStatus: 'open',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
    qualityCheck: 'uninspected',
    storageSlot: null
  };

  const payload = mapItemToDb(itemObj);
  console.log('Payload:', payload);

  const { data, error } = await supabase.from('items').insert([payload]);
  console.log('Result insert:', { data, error });

  if (!error) {
    // Clean up immediately
    await supabase.from('items').delete().eq('id', 'ITEM-TEST-QA-001');
    console.log('Cleaned up test item successfully.');
  }
}
testInsertMappedItem();
