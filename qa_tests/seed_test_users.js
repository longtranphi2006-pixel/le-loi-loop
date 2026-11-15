import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://ynkhukeqdqewakrqtvtu.supabase.co', 'sb_publishable_Uq2GNNl4Oj3PcWWRJpIUiQ_ew0XiUoX');

const USERS = [
  {
    id: 'HS001',
    name: 'Trần Bảo An',
    role: 'student',
    class: '7/1',
    shift: 'Sáng',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '0905.123.456',
    points: 15,
    bio: 'Học sinh lớp 7/1'
  },
  {
    id: 'HS002',
    name: 'Lê Hoàng Nam',
    role: 'student',
    class: '8/2',
    shift: 'Chiều',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    phone: '0914.789.012',
    points: 20,
    bio: 'Học sinh lớp 8/2'
  },
  {
    id: 'TR01',
    name: 'CLB Tình nguyện Lê Lợi (Đội trực trạm)',
    role: 'station_staff',
    class: 'Đội Tình Nguyện THCS Lê Lợi',
    shift: 'Cả ngày',
    avatar: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=150&auto=format&fit=crop&q=80',
    phone: 'Phòng Đội',
    points: 120,
    bio: 'Tổ xung kích kiểm tra chất lượng đồ dùng'
  },
  {
    id: 'GV01',
    name: 'Thầy Nguyễn Văn A',
    role: 'teacher',
    class: 'Giáo viên phụ trách KHKT',
    shift: 'Cả ngày',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    phone: 'Văn phòng Đoàn Đội',
    points: 250,
    bio: 'Giáo viên hướng dẫn đề tài KHKT Lê Lợi Loop'
  }
];

async function seedUsers() {
  const { data, error } = await supabase.from('users').upsert(USERS);
  if (error) {
    console.error('Error seeding users:', error);
  } else {
    console.log('Seeded users successfully:', data);
  }
}
seedUsers();
