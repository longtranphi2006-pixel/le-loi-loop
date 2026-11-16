-- =========================================================================
-- FILE: 007_production_mode_hardening.sql
-- MỤC ĐÍCH: DỌN DẸP DỮ LIỆU TEST & CHUYỂN SANG PHIÊN BẢN VẬN HÀNH THỰC TẾ (PRODUCTION)
-- DỰ ÁN: LÊ LỢI LOOP — THCS LÊ LỢI, THÀNH PHỐ ĐÀ NẴNG
-- MÔI TRƯỜNG THỰC THI: Supabase SQL Editor
-- =========================================================================

-- =========================================================================
-- PHẦN 1: DỌN DẸP TOÀN BỘ BẢN GHI GIẢ LẬP / DỮ LIỆU TEST NHANH CŨ
-- =========================================================================

-- 1.1. Xóa các appointments liên quan đến dữ liệu test/demo
DELETE FROM public.appointments
WHERE item_id IN (
  SELECT id FROM public.items 
  WHERE title ILIKE '[TEST%' 
     OR title ILIKE '[DEMO%' 
     OR title ILIKE '[THỰC-NGHIỆM%'
     OR id ILIKE 'DEMO%'
     OR id ILIKE 'M-KHKT%'
     OR id ILIKE 'APT-KHKT%'
);

-- 1.2. Xóa các requests liên quan đến dữ liệu test/demo
DELETE FROM public.requests
WHERE item_id IN (
  SELECT id FROM public.items 
  WHERE title ILIKE '[TEST%' 
     OR title ILIKE '[DEMO%' 
     OR title ILIKE '[THỰC-NGHIỆM%'
     OR id ILIKE 'DEMO%'
     OR id ILIKE 'M-KHKT%'
     OR id ILIKE 'REQ-KHKT%'
);

-- 1.3. Xóa các món đồ test/demo
DELETE FROM public.items
WHERE title ILIKE '[TEST%' 
   OR title ILIKE '[DEMO%' 
   OR title ILIKE '[THỰC-NGHIỆM%'
   OR id ILIKE 'DEMO%'
   OR id ILIKE 'M-KHKT%';

-- 1.4. Dọn dẹp các thông báo liên quan đến test
DELETE FROM public.notifications
WHERE title ILIKE '%TEST%' OR message ILIKE '%TEST%';

-- =========================================================================
-- PHẦN 2: TẠO TÀI KHOẢN GIÁO VIÊN QUẢN TRỊ VIÊN GỐC (MASTER TEACHER AUTH)
-- =========================================================================
-- Email: giaovien@leloiloop.edu.vn
-- Mật khẩu mặc định: LeLoiLoop@2026
-- Mã đăng nhập: GV01
-- =========================================================================

DO $$
DECLARE
  master_user_id UUID;
  encrypted_pw TEXT;
BEGIN
  -- Mã hóa mật khẩu chuẩn bcrypt
  encrypted_pw := crypt('LeLoiLoop@2026', gen_salt('bf', 10));

  -- 2.1. Kiểm tra tài khoản đã tồn tại trong auth.users chưa
  SELECT id INTO master_user_id 
  FROM auth.users 
  WHERE email = 'giaovien@leloiloop.edu.vn';

  IF master_user_id IS NULL THEN
    master_user_id := gen_random_uuid();

    -- Tạo tài khoản trong auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud
    ) VALUES (
      master_user_id,
      '00000000-0000-0000-0000-000000000000',
      'giaovien@leloiloop.edu.vn',
      encrypted_pw,
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'student_code', 'GV01',
        'full_name', 'Thầy Nguyễn Văn A (Phụ trách KHKT)',
        'class_name', 'Hội đồng SP',
        'study_shift', 'Cả ngày',
        'role', 'teacher'
      ),
      NOW(),
      NOW(),
      'authenticated',
      'authenticated'
    );
  ELSE
    -- Nếu đã có thì cập nhật mật khẩu và metadata
    UPDATE auth.users 
    SET encrypted_password = encrypted_pw,
        raw_user_meta_data = jsonb_build_object(
          'student_code', 'GV01',
          'full_name', 'Thầy Nguyễn Văn A (Phụ trách KHKT)',
          'class_name', 'Hội đồng SP',
          'study_shift', 'Cả ngày',
          'role', 'teacher'
        ),
        updated_at = NOW()
    WHERE id = master_user_id;
  END IF;

  -- 2.2. Đảm bảo hồ sơ trong public.profiles được tạo và gán đúng quyền 'teacher'
  INSERT INTO public.profiles (
    id,
    student_code,
    full_name,
    role,
    class_name,
    study_shift,
    phone_or_contact,
    avatar,
    points,
    created_at,
    updated_at
  ) VALUES (
    master_user_id,
    'GV01',
    'Thầy Nguyễn Văn A (Phụ trách KHKT)',
    'teacher',
    'Hội đồng Sư phạm',
    'Cả ngày',
    'Văn phòng Đội / Phòng KHKT',
    'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
    500,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    student_code = 'GV01',
    full_name = 'Thầy Nguyễn Văn A (Phụ trách KHKT)',
    role = 'teacher',
    class_name = 'Hội đồng Sư phạm',
    study_shift = 'Cả ngày',
    updated_at = NOW();

  RAISE NOTICE '✓ Khởi tạo thành công tài khoản Giáo viên Quản trị: giaovien@leloiloop.edu.vn (Mã: GV01)';
END $$;

-- =========================================================================
-- PHẦN 3: SIẾT CHẶT QUYỀN RLS CHO CHẾ ĐỘ VẬN HÀNH THỰC TẾ
-- =========================================================================

-- Đảm bảo RLS bật trên tất cả các bảng nghiệp vụ
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.station_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3.1. Bảng items: Khách chưa đăng nhập chỉ được xem các món đã duyệt công khai
DROP POLICY IF EXISTS "Public can view approved items" ON public.items;
CREATE POLICY "Public can view approved items"
ON public.items FOR SELECT
USING (
  status IN ('approved', 'matching', 'stored', 'completed')
  OR (auth.uid() IS NOT NULL AND donor_id = (SELECT student_code FROM public.profiles WHERE id = auth.uid()))
  OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('teacher', 'station_staff', 'admin')
);

-- 3.2. Bảng items: Chỉ người dùng đã đăng nhập mới được INSERT món mới với status = 'pending'
DROP POLICY IF EXISTS "Authenticated users insert items" ON public.items;
CREATE POLICY "Authenticated users insert items"
ON public.items FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND status = 'pending'
);

-- 3.3. Bảng requests: Chỉ người dùng đã đăng nhập mới được gửi yêu cầu nhận
DROP POLICY IF EXISTS "Authenticated users insert requests" ON public.requests;
CREATE POLICY "Authenticated users insert requests"
ON public.requests FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND status = 'pending'
);

-- 3.4. Bảng audit_logs: Ghi nhật ký bắt đầu phiên thực tế
INSERT INTO public.audit_logs (action, details, role, user_id)
VALUES (
  'KÍCH HOẠT PRODUCTION',
  'Hệ thống Lê Lợi Loop đã chuyển sang chế độ Vận hành Thực tế (Production Mode). Đã thiết lập tài khoản Quản trị viên gốc giaovien@leloiloop.edu.vn.',
  'Hệ thống Quản trị',
  'GV01'
);

RAISE NOTICE '=========================================================';
RAISE NOTICE 'HOÀN TẤT THIẾT LẬP MÔI TRƯỜNG VẬN HÀNH THỰC TẾ (PRODUCTION)';
RAISE NOTICE '=========================================================';
