-- =========================================================================
-- FILE: 000_base_schema.sql
-- MỤC ĐÍCH: KHỞI TẠO CẤU TRÚC 5 BẢNG CƠ BẢN CHO DATABASE SUPABASE MỚI (STAGING)
-- DỰ ÁN: LÊ LỢI LOOP — THCS LÊ LỢI ĐÀ NẴNG
-- =========================================================================
-- QUY TẮC AN TOÀN:
-- 1. CHỈ TẠO BẢNG CƠ BẢN VÀ BẬT RLS (KHÔNG TẠO POLICY PUBLIC-ALL / WITH CHECK(true)).
-- 2. TẤT CẢ RLS POLICIES AN TOÀN SẼ ĐƯỢC THIẾT LẬP TẠI 005_auth_rls_DRAFT_ONLY.sql.
-- 3. BẢO VỆ QUYỀN RIÊNG TƯ: KHÔNG ĐƯA BẢNG USERS VÀO REALTIME PUBLICATION.
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. BẢNG USERS (Danh mục thành viên Trường THCS Lê Lợi)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    class TEXT,
    shift TEXT,
    avatar TEXT,
    phone TEXT,
    points INTEGER DEFAULT 0,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BẢNG ITEMS (Kho đồ dùng học tập trao tặng)
CREATE TABLE IF NOT EXISTS public.items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    condition TEXT NOT NULL,
    description TEXT,
    donor_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    donor_name TEXT,
    available_slots JSONB DEFAULT '[]'::jsonb,
    input_method TEXT DEFAULT 'website',
    status TEXT NOT NULL DEFAULT 'pending',
    request_status TEXT NOT NULL DEFAULT 'open',
    image TEXT,
    quality_check JSONB DEFAULT NULL,
    storage_slot TEXT DEFAULT NULL,
    reject_reason TEXT DEFAULT NULL,
    update_note TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BẢNG REQUESTS (Yêu cầu xin nhận đồ từ học sinh)
CREATE TABLE IF NOT EXISTS public.requests (
    id TEXT PRIMARY KEY,
    item_id TEXT REFERENCES public.items(id) ON DELETE CASCADE,
    requester_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    requester_name TEXT NOT NULL,
    requester_class TEXT,
    reason TEXT NOT NULL,
    available_slots JSONB DEFAULT '[]'::jsonb,
    input_method TEXT DEFAULT 'website',
    status TEXT NOT NULL DEFAULT 'pending',
    lottery_rank INTEGER DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BẢNG APPOINTMENTS (Lịch hẹn điều phối ghép nối qua LoopMatch)
-- Hình thức trao nhận gồm: 'direct' (trực tiếp cùng ca) và 'station' / 'temporary_storage' (qua trạm lưu trữ)
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    item_id TEXT REFERENCES public.items(id) ON DELETE CASCADE,
    request_id TEXT REFERENCES public.requests(id) ON DELETE SET NULL,
    donor_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    requester_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL DEFAULT 'direct',
    donor_slot TEXT NOT NULL,
    requester_slot TEXT NOT NULL,
    storage_slot TEXT DEFAULT NULL,
    pickup_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    donor_arrived_at TIMESTAMPTZ DEFAULT NULL,
    picked_up_at TIMESTAMPTZ DEFAULT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BẢNG LOGS (Nhật ký kiểm toán hệ thống KHKT)
CREATE TABLE IF NOT EXISTS public.logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    role TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BẬT ROW LEVEL SECURITY (RLS) NGAY TỪ ĐẦU ĐỂ BẢO VỆ DỮ LIỆU
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- THÊM VÀO REALTIME PUBLICATION ĐỂ HỖ TRỢ ĐỒNG BỘ ĐA THIẾT BỊ
-- (CHỈ ĐỒNG BỘ CÁC BẢNG GIAO DỊCH TRỰC TIẾP; BẢNG USERS ĐƯỢC GIỮ KÍN ĐỂ BẢO VỆ DỮ LIỆU CÁ NHÂN HỌC SINH)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.requests;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.logs;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;


