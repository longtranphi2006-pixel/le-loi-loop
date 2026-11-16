-- =========================================================================
-- FILE: supabase/migrations/01_auth_and_profiles.sql
-- DỰ ÁN: LÊ LỢI LOOP — "ĐỒ CŨ TRAO TAY, GIÁ TRỊ Ở LẠI"
-- ĐỀ TÀI KHKT: THCS LÊ LỢI, THÀNH PHỐ ĐÀ NẴNG
-- MỤC ĐÍCH: HỆ THỐNG XÁC THỰC THỰC TẾ (SUPABASE AUTH), HỒ SƠ (PROFILES),
--           DATABASE TRIGGER TỰ ĐỘNG ĐỒNG BỘ VÀ PHÂN QUYỀN RBAC + RLS
-- =========================================================================

-- Kích hoạt extension pgcrypto để hỗ trợ tạo UUID và mã hóa mật khẩu
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- 1. BẢNG public.profiles (HỒ SƠ NGƯỜI DÙNG LIÊN KẾT auth.users)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    student_code TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    class_name TEXT,
    study_shift TEXT CHECK (study_shift IN ('Sáng', 'Chiều', 'Cả ngày')),
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'station_staff', 'teacher')),
    phone_or_contact TEXT,
    avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Đảm bảo các cột cần thiết tồn tại nếu bảng đã được tạo trước đó
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS class_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS study_shift TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_or_contact TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Chỉ mục tối ưu tìm kiếm theo student_code và vai trò
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_student_code ON public.profiles(student_code);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- =========================================================================
-- 2. DATABASE TRIGGER TỰ ĐỘNG ĐỒNG BỘ: public.handle_new_user()
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_student_code TEXT;
    v_full_name TEXT;
    v_class_name TEXT;
    v_study_shift TEXT;
    v_role TEXT;
    v_phone TEXT;
    v_avatar TEXT;
BEGIN
    -- 1. Trích xuất thông tin từ raw_user_meta_data
    v_student_code := COALESCE(
        NEW.raw_user_meta_data->>'student_code',
        NEW.raw_user_meta_data->>'student_id',
        UPPER(SPLIT_PART(NEW.email, '@', 1))
    );

    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        v_student_code
    );

    v_class_name := COALESCE(
        NEW.raw_user_meta_data->>'class_name',
        NEW.raw_user_meta_data->>'class',
        '7/1'
    );

    v_study_shift := COALESCE(
        NEW.raw_user_meta_data->>'study_shift',
        NEW.raw_user_meta_data->>'shift',
        'Sáng'
    );

    v_role := COALESCE(
        NEW.raw_user_meta_data->>'role',
        'student'
    );

    v_phone := NEW.raw_user_meta_data->>'phone_or_contact';

    v_avatar := COALESCE(
        NEW.raw_user_meta_data->>'avatar',
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
    );

    -- Chuẩn hóa study_shift hợp lệ
    IF v_study_shift NOT IN ('Sáng', 'Chiều', 'Cả ngày') THEN
        v_study_shift := 'Sáng';
    END IF;

    -- Chuẩn hóa role hợp lệ
    IF v_role NOT IN ('student', 'station_staff', 'teacher') THEN
        v_role := 'student';
    END IF;

    -- 2. Chèn hoặc cập nhật hồ sơ vào public.profiles
    INSERT INTO public.profiles (
        id,
        student_code,
        full_name,
        class_name,
        study_shift,
        role,
        phone_or_contact,
        avatar,
        points,
        created_at
    )
    VALUES (
        NEW.id,
        v_student_code,
        v_full_name,
        v_class_name,
        v_study_shift,
        v_role,
        v_phone,
        v_avatar,
        0,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        student_code = EXCLUDED.student_code,
        full_name = EXCLUDED.full_name,
        class_name = EXCLUDED.class_name,
        study_shift = EXCLUDED.study_shift,
        role = EXCLUDED.role,
        phone_or_contact = EXCLUDED.phone_or_contact;

    -- 3. Đồng bộ tương thích sang bảng public.users (hỗ trợ các khóa ngoại cũ)
    BEGIN
        INSERT INTO public.users (id, name, role, class, shift, avatar, phone, points, bio)
        VALUES (
            v_student_code,
            v_full_name,
            v_role,
            v_class_name,
            v_study_shift,
            v_avatar,
            v_phone,
            0,
            'Thành viên hệ thống Lê Lợi Loop'
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            class = EXCLUDED.class,
            shift = EXCLUDED.shift,
            phone = COALESCE(EXCLUDED.phone, public.users.phone);
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN NEW;
END;
$$;

-- Đăng ký trigger trên auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- 3. CHÍNH SÁCH BẢO MẬT ROW LEVEL SECURITY (RLS POLICIES)
-- =========================================================================

-- Bật RLS trên bảng profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Hàm trợ giúp lấy vai trò của người dùng hiện tại
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Cập nhật RLS trên bảng items
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Items viewable by all" ON public.items;
CREATE POLICY "Items viewable by all"
    ON public.items FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert items" ON public.items;
CREATE POLICY "Authenticated users can insert items"
    ON public.items FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "Teachers and staff can manage items" ON public.items;
CREATE POLICY "Teachers and staff can manage items"
    ON public.items FOR UPDATE
    TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- Cập nhật RLS trên bảng requests
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Requests viewable by all" ON public.requests;
CREATE POLICY "Requests viewable by all"
    ON public.requests FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert requests" ON public.requests;
CREATE POLICY "Authenticated users can insert requests"
    ON public.requests FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "Requests update" ON public.requests;
CREATE POLICY "Requests update"
    ON public.requests FOR UPDATE
    TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- Đưa profiles vào danh sách Supabase Realtime
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    EXCEPTION WHEN duplicate_object THEN NULL;
              WHEN undefined_object THEN NULL;
    END;
END $$;

-- =========================================================================
-- 4. KHỞI TẠO TÀI KHOẢN MẪU (SEED USERS CHO BUỔI TRÌNH DIỄN KHKT)
-- Mật khẩu mặc định: LeLoi@2026
-- Email đăng nhập: hs001@leloiloop.edu.vn, hs002@..., tr01@..., gv01@...
-- =========================================================================

DO $$
DECLARE
    v_pass_hash TEXT;
BEGIN
    -- Tạo mã băm bcrypt cho mật khẩu 'LeLoi@2026'
    v_pass_hash := crypt('LeLoi@2026', gen_salt('bf', 10));

    -- HS001: Trần Bảo An
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        'a0000001-0000-0000-0000-000000000001',
        'authenticated',
        'authenticated',
        'hs001@leloiloop.edu.vn',
        v_pass_hash,
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"student_code":"HS001","full_name":"Trần Bảo An","class_name":"7/1","study_shift":"Sáng","role":"student"}'::jsonb,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        encrypted_password = EXCLUDED.encrypted_password,
        raw_user_meta_data = EXCLUDED.raw_user_meta_data;

    -- HS002: Lê Hoàng Nam
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        'a0000002-0000-0000-0000-000000000002',
        'authenticated',
        'authenticated',
        'hs002@leloiloop.edu.vn',
        v_pass_hash,
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"student_code":"HS002","full_name":"Lê Hoàng Nam","class_name":"8/2","study_shift":"Chiều","role":"student"}'::jsonb,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        encrypted_password = EXCLUDED.encrypted_password,
        raw_user_meta_data = EXCLUDED.raw_user_meta_data;

    -- TR01: CLB Tình nguyện Lê Lợi (Đội trực trạm)
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        'a0000003-0000-0000-0000-000000000003',
        'authenticated',
        'authenticated',
        'tr01@leloiloop.edu.vn',
        v_pass_hash,
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"student_code":"TR01","full_name":"CLB Tình nguyện Lê Lợi","class_name":"Đội Tình Nguyện THCS Lê Lợi","study_shift":"Cả ngày","role":"station_staff"}'::jsonb,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        encrypted_password = EXCLUDED.encrypted_password,
        raw_user_meta_data = EXCLUDED.raw_user_meta_data;

    -- GV01: Thầy Nguyễn Văn A (Giáo viên phụ trách KHKT)
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        'a0000004-0000-0000-0000-000000000004',
        'authenticated',
        'authenticated',
        'gv01@leloiloop.edu.vn',
        v_pass_hash,
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"student_code":"GV01","full_name":"Thầy Nguyễn Văn A","class_name":"Giáo viên phụ trách KHKT","study_shift":"Cả ngày","role":"teacher"}'::jsonb,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        encrypted_password = EXCLUDED.encrypted_password,
        raw_user_meta_data = EXCLUDED.raw_user_meta_data;

    -- Khởi tạo hoặc cập nhật vào bảng profiles tương ứng
    INSERT INTO public.profiles (id, student_code, full_name, class_name, study_shift, role, avatar, points)
    VALUES
    ('a0000001-0000-0000-0000-000000000001', 'HS001', 'Trần Bảo An', '7/1', 'Sáng', 'student', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 15),
    ('a0000002-0000-0000-0000-000000000002', 'HS002', 'Lê Hoàng Nam', '8/2', 'Chiều', 'student', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', 20),
    ('a0000003-0000-0000-0000-000000000003', 'TR01', 'CLB Tình nguyện Lê Lợi (Đội trực trạm)', 'Đội Tình Nguyện THCS Lê Lợi', 'Cả ngày', 'station_staff', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=150&auto=format&fit=crop&q=80', 120),
    ('a0000004-0000-0000-0000-000000000004', 'GV01', 'Thầy Nguyễn Văn A', 'Giáo viên phụ trách KHKT', 'Cả ngày', 'teacher', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 250)
    ON CONFLICT (id) DO UPDATE SET
        student_code = EXCLUDED.student_code,
        full_name = EXCLUDED.full_name,
        class_name = EXCLUDED.class_name,
        study_shift = EXCLUDED.study_shift,
        role = EXCLUDED.role;

    -- Đồng bộ bảng public.users
    INSERT INTO public.users (id, name, role, class, shift, avatar, phone, points, bio)
    VALUES
    ('HS001', 'Trần Bảo An', 'student', '7/1', 'Sáng', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', '0905.123.456', 15, 'Học sinh lớp 7/1 – Đam mê đọc sách và chia sẻ đồ dùng học tập cũ'),
    ('HS002', 'Lê Hoàng Nam', 'student', '8/2', 'Chiều', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', '0914.789.012', 20, 'Học sinh lớp 8/2 – Yêu thích nghiên cứu khoa học kỹ thuật và hoạt động xanh'),
    ('TR01', 'CLB Tình nguyện Lê Lợi (Đội trực trạm)', 'station_staff', 'Đội Tình Nguyện THCS Lê Lợi', 'Cả ngày', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=150&auto=format&fit=crop&q=80', 'Phòng Đội', 120, 'Tổ xung kích kiểm tra chất lượng đồ dùng, phân loại và điều phối trao nhận tại trạm'),
    ('GV01', 'Thầy Nguyễn Văn A', 'teacher', 'Giáo viên phụ trách KHKT', 'Cả ngày', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'Văn phòng KHKT', 250, 'Giáo viên hướng dẫn đề tài KHKT Lê Lợi Loop – Quản lý, phê duyệt và giám sát hệ thống')
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        class = EXCLUDED.class,
        shift = EXCLUDED.shift;

END $$;
