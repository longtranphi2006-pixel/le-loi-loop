-- =========================================================================
-- FILE: setup_staging_accounts.sql
-- MỤC ĐÍCH: TỰ ĐỘNG LIÊN KẾT 4 HỒ SƠ PILOT (HS001, HS002, TR01, GV01)
--           VỚI SUPABASE AUTH UUID TRÊN MÔI TRƯỜNG STAGING
-- DỰ ÁN: LÊ LỢI LOOP — THCS LÊ LỢI, THÀNH PHỐ ĐÀ NẴNG
-- MÔI TRƯỜNG: Supabase Staging (Project ID: ynkhukeqdqewakrqtvtu)
-- TUYỆT ĐỐI KHÔNG CHẠY TRÊN: Production (vepuogmvrnhpwneufjff)
-- =========================================================================

-- =========================================================================
-- HƯỚNG DẪN DÀNH CHO QUẢN TRỊ VIÊN TRƯỚC KHI CHẠY SCRIPT NÀY:
-- 1. Mở Supabase Dashboard Staging (ynkhukeqdqewakrqtvtu).
-- 2. Vào mục: Authentication -> Users -> Add user -> Create user.
-- 3. Tạo chính xác 4 tài khoản với email kiểm thử sau (Auto Confirm Email = ON):
--    - pilot.donor@leloiloop.test      (Học sinh Cho - Trần Bảo An)
--    - pilot.requester@leloiloop.test  (Học sinh Nhận - Lê Hoàng Nam)
--    - pilot.station@leloiloop.test    (Quản sinh Trạm Phòng Đội)
--    - pilot.teacher@leloiloop.test    (Giáo viên Phụ trách KHKT)
-- 4. SAU ĐÓ MỚI CHẠY SCRIPT NÀY TRONG SQL EDITOR ĐỂ LIÊN KẾT HỒ SƠ.
-- =========================================================================

DO $$
DECLARE
    v_donor_uid UUID;
    v_requester_uid UUID;
    v_station_uid UUID;
    v_teacher_uid UUID;
    v_missing_list TEXT := '';
BEGIN
    -- 1. KIỂM TRA SỰ TỒN TẠI CỦA ĐỦ 4 AUTH USERS TRONG BẢNG auth.users
    -- CHẶN THÀNH CÔNG GIẢ: Nếu thiếu bất kỳ tài khoản nào, lập tức hủy giao dịch!
    SELECT id INTO v_donor_uid FROM auth.users WHERE email = 'pilot.donor@leloiloop.test';
    IF v_donor_uid IS NULL THEN 
        v_missing_list := v_missing_list || 'pilot.donor@leloiloop.test; '; 
    END IF;

    SELECT id INTO v_requester_uid FROM auth.users WHERE email = 'pilot.requester@leloiloop.test';
    IF v_requester_uid IS NULL THEN 
        v_missing_list := v_missing_list || 'pilot.requester@leloiloop.test; '; 
    END IF;

    SELECT id INTO v_station_uid FROM auth.users WHERE email = 'pilot.station@leloiloop.test';
    IF v_station_uid IS NULL THEN 
        v_missing_list := v_missing_list || 'pilot.station@leloiloop.test; '; 
    END IF;

    SELECT id INTO v_teacher_uid FROM auth.users WHERE email = 'pilot.teacher@leloiloop.test';
    IF v_teacher_uid IS NULL THEN 
        v_missing_list := v_missing_list || 'pilot.teacher@leloiloop.test; '; 
    END IF;

    IF v_missing_list != '' THEN
        RAISE EXCEPTION 'DỪNG THỰC THI: Chưa tạo đủ 4 email trên Supabase Auth Dashboard! Các email còn thiếu: %', v_missing_list;
    END IF;

    -- 2. ĐẢM BẢO 4 DÒNG TRONG public.users TỒN TẠI TRƯỚC (ĐỂ THỎA KHÓA NGOẠI profiles_legacy_user_id_fkey)
    -- Quy tắc an toàn: Không dùng số điện thoại minh họa (phone = NULL), Điểm khởi tạo = 0
    INSERT INTO public.users (id, name, role, class, shift, avatar, phone, points, bio)
    VALUES
    (
        'HS001', 'Trần Bảo An', 'student', '8/1', 'Sáng',
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        NULL, 0, 'Học sinh tham gia vận hành thử nghiệm dự án Lê Lợi Loop'
    ),
    (
        'HS002', 'Lê Hoàng Nam', 'student', '7/3', 'Chiều',
        'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
        NULL, 0, 'Học sinh tham gia vận hành thử nghiệm dự án Lê Lợi Loop'
    ),
    (
        'TR01', 'Đội Trực Trạm Phòng Đội', 'station_staff', 'CLB Đội', 'Cả ngày',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        NULL, 0, 'Bộ phận quản sinh trạm lưu giữ Phòng Đoàn Đội'
    ),
    (
        'GV01', 'Thầy Nguyễn Văn An', 'teacher', 'Hội đồng KHKT', 'Cả ngày',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
        NULL, 0, 'Giáo viên phụ trách hướng dẫn nghiên cứu KHKT'
    )
    ON CONFLICT (id) DO UPDATE 
    SET name = EXCLUDED.name, 
        role = EXCLUDED.role, 
        class = EXCLUDED.class, 
        shift = EXCLUDED.shift;

    -- 3. NẠP VÀ LIÊN KẾT CHÍNH XÁC AUTH UUID SANG BẢNG public.profiles
    -- Sử dụng ON CONFLICT (auth_user_id) an toàn, không ghi đè vai trò ngoài ý muốn
    INSERT INTO public.profiles (auth_user_id, legacy_user_id, full_name, role, class, shift, phone, points)
    VALUES
    (v_donor_uid, 'HS001', 'Trần Bảo An', 'student', '8/1', 'Sáng', NULL, 0)
    ON CONFLICT (auth_user_id) DO UPDATE 
    SET legacy_user_id = EXCLUDED.legacy_user_id,
        full_name = EXCLUDED.full_name,
        class = EXCLUDED.class,
        shift = EXCLUDED.shift;

    INSERT INTO public.profiles (auth_user_id, legacy_user_id, full_name, role, class, shift, phone, points)
    VALUES
    (v_requester_uid, 'HS002', 'Lê Hoàng Nam', 'student', '7/3', 'Chiều', NULL, 0)
    ON CONFLICT (auth_user_id) DO UPDATE 
    SET legacy_user_id = EXCLUDED.legacy_user_id,
        full_name = EXCLUDED.full_name,
        class = EXCLUDED.class,
        shift = EXCLUDED.shift;

    INSERT INTO public.profiles (auth_user_id, legacy_user_id, full_name, role, class, shift, phone, points)
    VALUES
    (v_station_uid, 'TR01', 'Đội Trực Trạm Phòng Đội', 'station_staff', 'CLB Đội', 'Cả ngày', NULL, 0)
    ON CONFLICT (auth_user_id) DO UPDATE 
    SET legacy_user_id = EXCLUDED.legacy_user_id,
        full_name = EXCLUDED.full_name,
        class = EXCLUDED.class,
        shift = EXCLUDED.shift;

    INSERT INTO public.profiles (auth_user_id, legacy_user_id, full_name, role, class, shift, phone, points)
    VALUES
    (v_teacher_uid, 'GV01', 'Thầy Nguyễn Văn An', 'teacher', 'Hội đồng KHKT', 'Cả ngày', NULL, 0)
    ON CONFLICT (auth_user_id) DO UPDATE 
    SET legacy_user_id = EXCLUDED.legacy_user_id,
        full_name = EXCLUDED.full_name,
        class = EXCLUDED.class,
        shift = EXCLUDED.shift;

    RAISE NOTICE '✓ THÀNH CÔNG: Đã khởi tạo và liên kết chuẩn xác 4 tài khoản thử nghiệm trên Staging!';
END $$;

-- 4. TRUY VẤN XÁC MINH KẾT QUẢ LIÊN KẾT (CHỈ ĐỌC)
SELECT 
    p.legacy_user_id,
    p.full_name,
    p.role,
    p.class,
    p.points,
    p.phone,
    au.email,
    au.id AS auth_uuid,
    au.email_confirmed_at IS NOT NULL AS email_confirmed
FROM public.profiles p
JOIN auth.users au ON p.auth_user_id = au.id
ORDER BY p.legacy_user_id;
