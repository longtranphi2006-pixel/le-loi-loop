/**
 * =========================================================================
 * KIỂM TRA KẾT NỐI SUPABASE STAGING AN TOÀN — CHỈ ĐỌC (READ-ONLY)
 * DỰ ÁN: LÊ LỢI LOOP — THCS LÊ LỢI ĐÀ NẴNG
 * =========================================================================
 * TUYỆT ĐỐI KHÔNG GHI DỮ LIỆU. KHÔNG CHẠY DDL / MIGRATION.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

console.log('=================================================================');
console.log('XÁC MINH KẾT NỐI SUPABASE STAGING ĐỘC LẬP');
console.log('Thời gian:', new Date().toISOString());
console.log('=================================================================\n');

// 1. ĐỌC CẤU HÌNH TỪ .env.staging
const stagingEnvPath = resolve(process.cwd(), '.env.staging');
if (!existsSync(stagingEnvPath)) {
  console.error('[LỖI] Không tìm thấy file .env.staging!');
  process.exit(1);
}

const envContent = readFileSync(stagingEnvPath, 'utf8');
const parseEnv = (content) => {
  const result = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      result[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
  }
  return result;
};

const stagingEnv = parseEnv(envContent);
const stagingUrl = stagingEnv.VITE_SUPABASE_URL;
const stagingKey = stagingEnv.VITE_SUPABASE_ANON_KEY;

console.log('1. THÔNG TIN CẤU HÌNH STAGING:');
console.log('   - URL:', stagingUrl);
console.log('   - Key:', stagingKey ? `${stagingKey.slice(0, 16)}...${stagingKey.slice(-6)}` : 'TRỐNG');

// 2. XÁC MINH PROJECT ID VÀ RANH GIỚI AN TOÀN
const PROD_ID = 'vepuogmvrnhpwneufjff';
const EXPECTED_STAGING_ID = 'ynkhukeqdqewakrqtvtu';

const match = (stagingUrl || '').match(/^https?:\/\/([^.]+)\.supabase\.co/);
const currentProjectId = match ? match[1] : '';

console.log('\n2. KIỂM SOÁT RANH GIỚI AN TOÀN PROJECT ID:');
console.log('   - Project ID nhận diện được:', currentProjectId);
console.log('   - Project ID Production:', PROD_ID);
console.log('   - Project ID Staging mong đợi:', EXPECTED_STAGING_ID);

if (currentProjectId === PROD_ID) {
  console.error('\n[NGĂN CHẶN NGUY HIỂM] PHÁT HIỆN PROJECT ID LÀ PRODUCTION!');
  console.error('DỪNG TOÀN BỘ HOẠT ĐỘNG NGAY LẬP TỨC ĐỂ BẢO VỆ DỮ LIỆU THỰC.');
  process.exit(1);
}

if (currentProjectId !== EXPECTED_STAGING_ID) {
  console.error(`\n[CẢNH BÁO] Project ID (${currentProjectId}) không khớp với Staging mong đợi (${EXPECTED_STAGING_ID}).`);
  process.exit(1);
}

console.log('   => [PASS] Project ID khớp chính xác ynkhukeqdqewakrqtvtu và HOÀN TOÀN TÁCH BIỆT với Production.');

// 3. KHỞI TẠO CLIENT ĐỌC READ-ONLY
const stagingClient = createClient(stagingUrl, stagingKey, {
  auth: { persistSession: false }
});

// 4. KIỂM TRA TRUY VẤN READ-ONLY CÁC BẢNG TRÊN STAGING DATABASE
console.log('\n3. KIỂM TRA HIỆN TRẠNG DATABASE STAGING (READ-ONLY PROBING):');

const tablesToCheck = [
  'users',
  'items',
  'requests',
  'appointments',
  'logs',
  'notifications',
  'station_slots',
  'storage_assignments',
  'profiles'
];

let existingTables = [];
let missingTables = [];
let connectionAlive = false;

for (const tableName of tablesToCheck) {
  try {
    // Thực hiện truy vấn SELECT LIMIT 0 để kiểm tra schema chính xác
    const { data, error, status } = await stagingClient
      .from(tableName)
      .select('*')
      .limit(0);

    if (error) {
      // Mã lỗi PGRST205 hoặc 42P01: Table does not exist in schema cache
      if (
        error.code === '42P01' || 
        error.code === 'PGRST205' || 
        error.message.includes('does not exist') || 
        error.message.includes('schema cache')
      ) {
        missingTables.push({ table: tableName, reason: 'Chưa tồn tại trong schema (Database mới khởi tạo)' });
        connectionAlive = true; // Nhận được phản hồi chính xác từ PostgREST chứng minh kết nối Staging hoàn toàn sống!
      } else {
        missingTables.push({ table: tableName, reason: `Lỗi: ${error.message} (Code: ${error.code})` });
        connectionAlive = true;
      }
    } else {
      existingTables.push({ table: tableName, status, rows: data });
      connectionAlive = true;
    }
  } catch (err) {
    console.error(`   - Lỗi khi kết nối tới bảng ${tableName}:`, err.message);
  }
}

console.log('\n4. KẾT QUẢ XÁC MINH:');
console.log(`   - Trạng thái kết nối Supabase Cloud: ${connectionAlive ? 'THÀNH CÔNG (REST API ĐANG HOẠT ĐỘNG)' : 'THẤT BẠI (Mất kết nối)'}`);
console.log(`   - Bảng đã tồn tại trên Staging (${existingTables.length}/${tablesToCheck.length}):`, existingTables.map(t => t.table));
console.log(`   - Bảng chưa tồn tại trên Staging (${missingTables.length}/${tablesToCheck.length}):`);
for (const m of missingTables) {
  console.log(`     * ${m.table}: ${m.reason}`);
}

if (existingTables.length === 0 && connectionAlive) {
  console.log('\n=> ĐÁNH GIÁ: Đây là một Supabase Database MỚI TINH (Fresh Project).');
  console.log('   Toàn bộ bảng ứng dụng chưa được khởi tạo. Không có dữ liệu cũ.');
  console.log('   Cần triển khai Migration để khởi tạo cấu trúc.');
}

console.log('\n=================================================================');
console.log('HOÀN TẤT KIỂM TRA READ-ONLY AN TOÀN. KHÔNG CÓ THAY ĐỔI DỮ LIỆU.');
console.log('=================================================================');
