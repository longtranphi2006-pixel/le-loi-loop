/**
 * =========================================================================
 * KIỂM CHỨNG CÚ PHÁP VÀ RÀNG BUỘC PHỤ THUỘC MIGRATION 000
 * DỰ ÁN: LÊ LỢI LOOP — THCS LÊ LỢI ĐÀ NẴNG
 * =========================================================================
 * TUYỆT ĐỐI AN TOÀN — KHÔNG THAY ĐỔI BẤT KỲ DỮ LIỆU NÀO TRÊN PRODUCTION HAY CLOUD.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

console.log('=================================================================');
console.log('KIỂM CHỨNG CÚ PHÁP VÀ TÍNH TƯƠNG THÍCH CỦA MIGRATION 000');
console.log('Thời gian:', new Date().toISOString());
console.log('=================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failCount++;
  }
}

// 1. ĐỌC FILE SQL NGUYÊN VĂN TỪ Ổ ĐĨA
const migrationPath = resolve(process.cwd(), 'upgrade_plan/migrations/000_base_schema.sql');
assert(existsSync(migrationPath), 'File upgrade_plan/migrations/000_base_schema.sql tồn tại trên ổ đĩa');

const sql = readFileSync(migrationPath, 'utf8');

// 2. KIỂM TRA 5 BẢNG CƠ SỞ
assert(/CREATE TABLE IF NOT EXISTS public\.users\s*\(/i.test(sql), 'Khởi tạo bảng public.users');
assert(/CREATE TABLE IF NOT EXISTS public\.items\s*\(/i.test(sql), 'Khởi tạo bảng public.items');
assert(/CREATE TABLE IF NOT EXISTS public\.requests\s*\(/i.test(sql), 'Khởi tạo bảng public.requests');
assert(/CREATE TABLE IF NOT EXISTS public\.appointments\s*\(/i.test(sql), 'Khởi tạo bảng public.appointments');
assert(/CREATE TABLE IF NOT EXISTS public\.logs\s*\(/i.test(sql), 'Khởi tạo bảng public.logs');

// 3. KIỂM TRA ĐỦ TOÀN BỘ CỘT CỦA APPOINTMENTS VÀ GIÁ TRỊ TYPE
assert(/type TEXT NOT NULL DEFAULT 'direct'/i.test(sql), 'appointments.type có DEFAULT là "direct", hỗ trợ cả direct và station');
assert(/storage_slot TEXT DEFAULT NULL/i.test(sql), 'appointments có cột storage_slot nullable');
assert(/pickup_code TEXT NOT NULL/i.test(sql), 'appointments có cột pickup_code NOT NULL');
assert(!/pickup_code TEXT NOT NULL UNIQUE/i.test(sql), 'Đã gỡ UNIQUE toàn cục trên pickup_code để nhường quyền cho partial unique index trong migration 004');

// 4. KIỂM TRA KHÔNG ĐƯA PUBLIC.USERS VÀO REALTIME PUBLICATION
assert(!/ALTER PUBLICATION supabase_realtime ADD TABLE public\.users/i.test(sql), 'Đã loại bỏ bảng public.users khỏi publication Realtime (Bảo vệ thông tin học sinh)');
assert(/ALTER PUBLICATION supabase_realtime ADD TABLE public\.items/i.test(sql), 'Đưa public.items vào Realtime');
assert(/ALTER PUBLICATION supabase_realtime ADD TABLE public\.requests/i.test(sql), 'Đưa public.requests vào Realtime');
assert(/ALTER PUBLICATION supabase_realtime ADD TABLE public\.appointments/i.test(sql), 'Đưa public.appointments vào Realtime');
assert(/ALTER PUBLICATION supabase_realtime ADD TABLE public\.logs/i.test(sql), 'Đưa public.logs vào Realtime');

// 5. KIỂM TRA RLS BẬT MẶC ĐỊNH
assert(/ALTER TABLE public\.users ENABLE ROW LEVEL SECURITY/i.test(sql), 'RLS được bật trên public.users');
assert(/ALTER TABLE public\.items ENABLE ROW LEVEL SECURITY/i.test(sql), 'RLS được bật trên public.items');
assert(/ALTER TABLE public\.requests ENABLE ROW LEVEL SECURITY/i.test(sql), 'RLS được bật trên public.requests');
assert(/ALTER TABLE public\.appointments ENABLE ROW LEVEL SECURITY/i.test(sql), 'RLS được bật trên public.appointments');
assert(/ALTER TABLE public\.logs ENABLE ROW LEVEL SECURITY/i.test(sql), 'RLS được bật trên public.logs');

// 6. KIỂM TRA KHÔNG CÓ POLICY PUBLIC-ALL HOẶC LỖ HỔNG TRONG CÂU LỆNH THỰC THI (LOẠI BỎ COMMENT)
const sqlCodeOnly = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
assert(!/WITH CHECK\s*\(\s*true\s*\)/i.test(sqlCodeOnly), 'Không có bất kỳ policy lỏng lẻo WITH CHECK (true) trong câu lệnh SQL');
assert(!/USING\s*\(\s*true\s*\)/i.test(sqlCodeOnly), 'Không có bất kỳ policy lỏng lẻo USING (true) trong câu lệnh SQL');

// 7. KIỂM TRA KHÔNG CÓ CÂU LỆNH PHÁ HỦY
assert(!/DROP TABLE/i.test(sql), 'Không có lệnh DROP TABLE');
assert(!/TRUNCATE/i.test(sql), 'Không có lệnh TRUNCATE');
assert(!/DELETE FROM/i.test(sql), 'Không có lệnh DELETE FROM');

// 8. KIỂM TRA TARGET PROJECT ID TRONG .env.staging
const stagingEnvPath = resolve(process.cwd(), '.env.staging');
const stagingEnvContent = readFileSync(stagingEnvPath, 'utf8');
assert(stagingEnvContent.includes('ynkhukeqdqewakrqtvtu'), 'Cấu hình Staging trỏ đúng Project ID ynkhukeqdqewakrqtvtu');
assert(!stagingEnvContent.includes('vepuogmvrnhpwneufjff'), 'Cấu hình Staging không chứa Project ID Production vepuogmvrnhpwneufjff');

// 9. KIỂM TRA PRODUCTION .env NGUYÊN VẸN
const prodEnvPath = resolve(process.cwd(), '.env');
const prodEnvContent = readFileSync(prodEnvPath, 'utf8');
assert(prodEnvContent.includes('vepuogmvrnhpwneufjff'), 'Cấu hình Production .env vẫn bảo lưu Project ID vepuogmvrnhpwneufjff');

console.log('\n=================================================================');
console.log(`KẾT QUẢ KIỂM CHỨNG MIGRATION 000: PASS = ${passCount}, FAIL = ${failCount}`);
console.log('=================================================================');

if (failCount > 0) process.exit(1);
