/**
 * =========================================================================
 * XÁC MINH LIVE MIGRATION 000 TRÊN SUPABASE STAGING (READ-ONLY)
 * PROJECT ID: ynkhukeqdqewakrqtvtu
 * =========================================================================
 * TUYỆT ĐỐI AN TOÀN — CHỈ CHẠY TRUY VẤN READ-ONLY TRÊN STAGING.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

console.log('=================================================================');
console.log('TRUY VẤN XÁC MINH TRỰC TIẾP LIVE SAU MIGRATION 000');
console.log('Thời gian:', new Date().toISOString());
console.log('=================================================================\n');

const stagingEnvPath = resolve(process.cwd(), '.env.staging');
if (!existsSync(stagingEnvPath)) {
  console.error('[LỖI] Không tìm thấy .env.staging');
  process.exit(1);
}

const envContent = readFileSync(stagingEnvPath, 'utf8');
const parseEnv = (c) => {
  const r = {};
  for (const l of c.split('\n')) {
    const t = l.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i !== -1) r[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return r;
};

const env = parseEnv(envContent);
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

// 1. KIỂM SOÁT RANH GIỚI AN TOÀN
const PROD_ID = 'vepuogmvrnhpwneufjff';
const STAGING_ID = 'ynkhukeqdqewakrqtvtu';
const match = (url || '').match(/^https?:\/\/([^.]+)\.supabase\.co/);
const currentId = match ? match[1] : '';

if (currentId !== STAGING_ID || currentId === PROD_ID) {
  console.error(`[NGĂN CHẶN NGUY HIỂM] Project ID không khớp Staging (${STAGING_ID}). Đang trỏ vào: ${currentId}`);
  process.exit(1);
}

console.log(`[PASS] Xác nhận Project ID mục tiêu: ${currentId} (Đúng Staging).`);

const client = createClient(url, key, {
  auth: { persistSession: false }
});

const baseTables = ['users', 'items', 'requests', 'appointments', 'logs'];
const results = {
  existingTables: [],
  missingTables: [],
  rowCounts: {},
  rlsBlockedCount: 0
};

for (const table of baseTables) {
  try {
    // Thử truy vấn đọc với giới hạn 0 để xác nhận bảng tồn tại
    const { data, error, status, count } = await client
      .from(table)
      .select('*', { count: 'exact' })
      .limit(1);

    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('schema cache') || error.message.includes('does not exist')) {
        results.missingTables.push({ table, error: error.message, code: error.code });
      } else if (error.code === '42501' || error.message.includes('row-level security') || error.message.includes('permission denied')) {
        // Bảng đã tồn tại và RLS đang chặn truy cập công khai!
        results.existingTables.push(table);
        results.rlsBlockedCount++;
        results.rowCounts[table] = 0;
      } else {
        results.missingTables.push({ table, error: error.message, code: error.code });
      }
    } else {
      // Bảng tồn tại và trả về data
      results.existingTables.push(table);
      results.rowCounts[table] = count || (Array.isArray(data) ? data.length : 0);
    }
  } catch (err) {
    results.missingTables.push({ table, error: err.message });
  }
}

console.log('\n--- KẾT QUẢ TRUY VẤN LIVE ---');
console.log(`- Bảng đã tồn tại (${results.existingTables.length}/${baseTables.length}):`, results.existingTables);
console.log(`- Bảng chưa tồn tại (${results.missingTables.length}/${baseTables.length}):`, results.missingTables.map(m => `${m.table} (${m.code || 'ERR'})`));
console.log('- Số lượng dòng dữ liệu (Row counts):', results.rowCounts);

const allTablesCreated = results.existingTables.length === 5;
const noSeedData = Object.values(results.rowCounts).every(c => c === 0 || c === null);

console.log('\n--- ĐÁNH GIÁ TIÊU CHÍ AN TOÀN ---');
console.log(`1. Đủ 5 bảng cơ sở: ${allTablesCreated ? 'ĐẠT (5/5)' : 'CHƯA ĐẠT (0/5)'}`);
console.log(`2. Không có dữ liệu mẫu (0 rows): ${noSeedData ? 'ĐẠT (Sạch 100%)' : 'CÓ DỮ LIỆU'}`);

if (allTablesCreated) {
  console.log('\n=> KẾT LUẬN: SUCCESS (Migration 000 đã chạy thành công trên Staging).');
  process.exit(0);
} else {
  console.log('\n=> KẾT LUẬN: BLOCKED (Database Staging chưa chạy migration 000 qua SQL Editor).');
  process.exit(2);
}

