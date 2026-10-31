-- =========================================================================
-- FILE: setup_staging_accounts.sql
-- MỤC ĐÍCH: HƯỚNG DẪN KHỞI TẠO VÀ LIÊN KẾT 4 TÀI KHOẢN TRÊN SUPABASE STAGING
-- DỰ ÁN: LÊ LỢI LOOP — THCS LÊ LỢI ĐÀ NẴNG
-- =========================================================================
-- QUY TẮC AN TOÀN:
-- 1. CHỈ CHẠY TRÊN PROJECT STAGING ĐỘC LẬP.
-- 2. KHÔNG HARDCODE MẬT KHẨU TRONG SCRIPT NÀY.
-- 3. DÙNG TÊN MIỀN KIỂM THỬ CHUẨN RFC 2606 (@leloiloop.test), KHÔNG GIẢ DANH TRƯỜNG.
-- =========================================================================

-- BƯỚC 1: TẠO 4 TÀI KHOẢN TRONG SUPABASE DASHBOARD
-- Vào: Authentication -> Users -> Add user -> Create user
-- Điền các email sau kèm mật khẩu an toàn do Ban Quản trị chỉ định:
-- 1. pilot.donor@leloiloop.test      (Dành cho Học sinh Cho - Trần Bảo An)
-- 2. pilot.requester@leloiloop.test  (Dành cho Học sinh Nhận - Lê Hoàng Nam)
-- 3. pilot.station@leloiloop.test    (Dành cho Quản sinh Trạm Phòng Đội)
-- 4. pilot.teacher@leloiloop.test    (Dành cho Giáo viên Phụ trách KHKT)
--
-- Lưu ý: Khi tạo qua Dashboard, Supabase tự động đánh dấu email_confirmed_at = NOW()
-- mà KHÔNG cần tắt xác thực email trên toàn hệ thống.

-- BƯỚC 2: SAU KHI TẠO 4 TÀI KHOẢN Ở BƯỚC 1, CHẠY CÂU LỆNH SQL DƯỚI ĐÂY
-- ĐỂ TỰ ĐỘNG ÁNH XẠ AUTH UUID SANG BẢNG PROFILES VÀ USERS:

INSERT INTO public.profiles (auth_user_id, legacy_user_id, full_name, role, class, shift, phone, points)
SELECT 
    au.id AS auth_user_id,
    'HS001' AS legacy_user_id,
    'Trần Bảo An' AS full_name,
    'student' AS role,
    '8/1' AS class,
    'Sáng' AS shift,
    '0905123456' AS phone,
    120 AS points
FROM auth.users au
WHERE au.email = 'pilot.donor@leloiloop.test'
ON CONFLICT (auth_user_id) DO UPDATE 
SET legacy_user_id = EXCLUDED.legacy_user_id, role = EXCLUDED.role;

INSERT INTO public.profiles (auth_user_id, legacy_user_id, full_name, role, class, shift, phone, points)
SELECT 
    au.id AS auth_user_id,
    'HS002' AS legacy_user_id,
    'Lê Hoàng Nam' AS full_name,
    'student' AS role,
    '7/3' AS class,
    'Chiều' AS shift,
    '0905234567' AS phone,
    85 AS points
FROM auth.users au
WHERE au.email = 'pilot.requester@leloiloop.test'
ON CONFLICT (auth_user_id) DO UPDATE 
SET legacy_user_id = EXCLUDED.legacy_user_id, role = EXCLUDED.role;

INSERT INTO public.profiles (auth_user_id, legacy_user_id, full_name, role, class, shift, phone, points)
SELECT 
    au.id AS auth_user_id,
    'TR01' AS legacy_user_id,
    'Đội Trực Trạm Phòng Đội' AS full_name,
    'station_staff' AS role,
    'CLB Đội' AS class,
    'Cả ngày' AS shift,
    '0905345678' AS phone,
    350 AS points
FROM auth.users au
WHERE au.email = 'pilot.station@leloiloop.test'
ON CONFLICT (auth_user_id) DO UPDATE 
SET legacy_user_id = EXCLUDED.legacy_user_id, role = EXCLUDED.role;

INSERT INTO public.profiles (auth_user_id, legacy_user_id, full_name, role, class, shift, phone, points)
SELECT 
    au.id AS auth_user_id,
    'GV01' AS legacy_user_id,
    'Thầy Nguyễn Văn An' AS full_name,
    'teacher' AS role,
    'Hội đồng KHKT' AS class,
    'Cả ngày' AS shift,
    '0905456789' AS phone,
    500 AS points
FROM auth.users au
WHERE au.email = 'pilot.teacher@leloiloop.test'
ON CONFLICT (auth_user_id) DO UPDATE 
SET legacy_user_id = EXCLUDED.legacy_user_id, role = EXCLUDED.role;

-- BƯỚC 3: KIỂM CHỨNG LIÊN KẾT DANH TÍNH THÀNH CÔNG:
SELECT 
    p.legacy_user_id,
    p.full_name,
    p.role,
    p.class,
    au.email,
    au.id AS auth_uuid,
    au.email_confirmed_at IS NOT NULL AS email_confirmed
FROM public.profiles p
JOIN auth.users au ON p.auth_user_id = au.id
ORDER BY p.legacy_user_id;

