# BÁO CÁO THỰC THI MIGRATION 000 TRÊN SUPABASE STAGING

**Dự án:** LÊ LỢI LOOP — THCS Lê Lợi, TP. Đà Nẵng  
**Mục tiêu:** Thực thi và xác minh [`upgrade_plan/migrations/000_base_schema.sql`](file:///d:/Lê%20Lợi%20Loop/upgrade_plan/migrations/000_base_schema.sql)  
**Thời gian kiểm tra live:** 2026-10-30  
**Project ID Staging mục tiêu:** `ynkhukeqdqewakrqtvtu`  
**Project ID Production được bảo vệ:** `vepuogmvrnhpwneufjff` (Không tác động)  

---

## 1. KẾT QUẢ KIỂM TRA KẾT NỐI VÀ QUYỀN TRUY CẬP

1. **Kiểm soát ranh giới Project ID:**
   - URL kết nối: `https://ynkhukeqdqewakrqtvtu.supabase.co`
   - Project ID nhận diện: `ynkhukeqdqewakrqtvtu` (ĐÚNG STAGING, HOÀN TOÀN TÁCH BIỆT PRODUCTION `vepuogmvrnhpwneufjff`).
2. **Quyền hạn truy cập từ Client:**
   - Khóa truy cập hiện tại trong kho mã nguồn là `VITE_SUPABASE_ANON_KEY=sb_publishable_...` (Anon Publishable Key).
   - Theo kiến trúc bảo mật của Supabase, Anon Key chỉ có quyền gọi PostgREST API (DML theo chính sách RLS) và **KHÔNG có quyền thực thi lệnh DDL quản trị (`CREATE TABLE`, `ALTER TABLE`, `ALTER PUBLICATION`)**.
   - Do đó, việc thực thi file DDL `000_base_schema.sql` cần được chạy trực tiếp trong **Supabase Dashboard SQL Editor** của dự án Staging `ynkhukeqdqewakrqtvtu`.

---

## 2. KẾT QUẢ TRUY VẤN XÁC MINH TRỰC TIẾP (LIVE PROBE TRƯỚC THỰC THI)

Thực thi kiểm tra live qua script: [`scripts/verify_staging_migration_000_live.js`](file:///d:/Lê%20Lợi%20Loop/scripts/verify_staging_migration_000_live.js):

| Bảng kiểm tra | Mã phản hồi HTTP | Mã lỗi PostgREST | Trạng thái hiện tại |
|---|:---:|:---:|---|
| `public.users` | 404 Not Found | `PGRST205` | Chưa tồn tại trong schema cache |
| `public.items` | 404 Not Found | `PGRST205` | Chưa tồn tại trong schema cache |
| `public.requests` | 404 Not Found | `PGRST205` | Chưa tồn tại trong schema cache |
| `public.appointments` | 404 Not Found | `PGRST205` | Chưa tồn tại trong schema cache |
| `public.logs` | 404 Not Found | `PGRST205` | Chưa tồn tại trong schema cache |

**Đánh giá:** Database Staging hiện tại sạch 100%, chưa có bảng nào được tạo.

---

## 3. HƯỚNG DẪN 3 BƯỚC THỰC THI MIGRATION 000 TRÊN DASHBOARD STAGING

Chủ dự án thực hiện thao tác nhanh trong 1 phút theo các bước sau:

### Bước 1: Mở SQL Editor của Project Staging
Truy cập đường dẫn trực tiếp:  
👉 **https://supabase.com/dashboard/project/ynkhukeqdqewakrqtvtu/sql/new**  
*(Kiểm tra thanh URL hoặc góc trái Dashboard để chắc chắn đang ở Project `ynkhukeqdqewakrqtvtu`, KHÔNG PHẢI `vepuogmvrnhpwneufjff`)*.

### Bước 2: Dán toàn bộ nội dung SQL dưới đây và bấm RUN

```sql
-- =========================================================================
-- FILE: 000_base_schema.sql
-- MỤC ĐÍCH: KHỞI TẠO CẤU TRÚC 5 BẢNG CƠ BẢN CHO DATABASE SUPABASE MỚI (STAGING)
-- DỰ ÁN: LÊ LỢI LOOP — THCS LÊ LỢI ĐÀ NẴNG
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
```

### Bước 3: Xác nhận câu lệnh chạy thành công
Sau khi bấm **Run**, Supabase SQL Editor sẽ hiển thị thông báo: `Success. No rows returned`.

---

## 4. KẾT LUẬN VÀ TRẠNG THÁI HIỆN TẠI

> [!WARNING]
> **KẾT LUẬN TRẠNG THÁI:** **`BLOCKED`**  
> *(Lý do: Đang chờ Chủ dự án thực hiện thao tác Run script trên Supabase Dashboard SQL Editor `ynkhukeqdqewakrqtvtu`).*

Ngay sau khi bạn dán và bấm **Run** thành công trên Dashboard, hãy phản hồi để tôi lập tức kích hoạt script xác minh live và lập báo cáo chuyển sang **`SUCCESS`**!

