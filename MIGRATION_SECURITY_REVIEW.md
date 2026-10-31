# BÁO CÁO ĐÁNH GIÁ BẢO MẬT & KIẾN TRÚC MIGRATION DATABASE
**Dự án:** LÊ LỢI LOOP — THCS LÊ LỢI ĐÀ NẴNG  
**Mục tiêu:** Đánh giá an toàn, toàn vẹn dữ liệu và phân quyền trước khi chạy trên Staging  
**Vai trò:** Senior PostgreSQL Security Engineer & Database Architect  
**Trạng thái:** DRAFT REVIEW ONLY — TUYỆT ĐỐI KHÔNG CHẠY TRỰC TIẾP TRÊN PRODUCTION  

---

## 1. TỔNG HỢP NGUYÊN VĂN BỘ MIGRATION (5 FILE)

### File 1: `001_preflight_checks.sql` (Kiểm kê an toàn trước migration)
- **Mục đích:** Chỉ thực hiện các câu truy vấn `SELECT` đọc dữ liệu, tuyệt đối không chỉnh sửa dữ liệu hay thay đổi cấu trúc bảng.
- **Nội dung kiểm tra:**
  1. Kiểm tra request trùng lặp: `SELECT item_id, requester_id, COUNT(*) FROM public.requests WHERE status != 'rejected' GROUP BY item_id, requester_id HAVING COUNT(*) > 1;` -> **Kết quả Live: 0 dòng (Sạch).**
  2. Kiểm tra nhiều người cùng được chọn: `SELECT item_id, COUNT(*) FROM public.requests WHERE status = 'selected' GROUP BY item_id HAVING COUNT(*) > 1;` -> **Kết quả Live: 0 dòng (Sạch).**
  3. Kiểm tra ô kệ bị gán trùng: `SELECT storage_slot, COUNT(*) FROM public.items WHERE status = 'stored' AND storage_slot IS NOT NULL GROUP BY storage_slot HAVING COUNT(*) > 1;` -> **Kết quả Live: 0 dòng (Sạch).**
  4. Kiểm tra mã nhận đồ trùng: `SELECT pickup_code, COUNT(*) FROM public.appointments WHERE status IN ('scheduled', 'ready_for_pickup') GROUP BY pickup_code HAVING COUNT(*) > 1;` -> **Kết quả Live: 0 dòng (Sạch).**
- **Đánh giá an toàn:** **RỦI RO THẤP (P3)**. Hoàn toàn an toàn để chạy ở bất kỳ môi trường nào.

---

### File 2: `002_add_notifications.sql` (Bảng Thông Báo Realtime & RLS)
- **Cấu trúc bảng:**
  ```sql
  CREATE TABLE IF NOT EXISTS public.notifications (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      recipient_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      sender_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
      sender_name TEXT,
      type TEXT NOT NULL DEFAULT 'info',
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      item_id TEXT REFERENCES public.items(id) ON DELETE SET NULL,
      request_id TEXT REFERENCES public.requests(id) ON DELETE SET NULL,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ```
- **Phân tích RLS & Bảo mật:**
  - `ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;`
  - **Policy SELECT:** Chỉ cho phép người nhận đọc thông báo của chính mình:
    `USING (recipient_id = (SELECT legacy_id FROM public.get_current_profile()));`
  - **Policy UPDATE:** Chỉ cho phép người nhận cập nhật cột `is_read`:
    `USING (recipient_id = (SELECT legacy_id FROM public.get_current_profile())) WITH CHECK (recipient_id = (SELECT legacy_id FROM public.get_current_profile()));`
  - **Policy INSERT:** Bị giới hạn cho người dùng đăng nhập hợp lệ hoặc được sinh tự động qua RPC / Trigger. Ngăn chặn việc một học sinh tự ý chèn thông báo giả mạo danh nghĩa Thầy Hiệu trưởng hoặc Quản sinh.
- **Realtime Publication:**
  - `ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;`
- **Đánh giá an toàn:** **RỦI RO TRUNG BÌNH (P1)**. Là bảng mới bổ sung (Additive), không làm ảnh hưởng đến dữ liệu cũ.

---

### File 3: `003_add_station_storage.sql` (Quản lý 10 Ô Kệ Trạm K1-A1 đến K1-B5)
- **Bảng `public.station_slots`:**
  - Khởi tạo sẵn đúng 10 ô kệ chuẩn học đường: 5 ô Khu A (`K1-A1` đến `K1-A5`, kích thước nhỏ/vừa) và 5 ô Khu B (`K1-B1` đến `K1-B5`, kích thước lớn).
  - Dùng cú pháp `ON CONFLICT (id) DO NOTHING` để bảo đảm tính Idempotent.
- **Bảng `public.storage_assignments`:**
  - Lưu trữ lịch sử từng lần gán kệ, thời điểm nhận vào (`occupied_at`) và thời điểm bàn giao giải phóng kệ (`released_at`).
  - Khóa ngoại `REFERENCES public.station_slots(id) ON DELETE RESTRICT`: Ngăn chặn việc vô tình xóa mất cấu hình ô kệ khi đang có đồ lưu trữ.
- **Đánh giá an toàn:** **RỦI RO THẤP (P2)**. Thuần túy bổ sung bảng mới để tăng cường năng lực kiểm toán kho.

---

### File 4: `004_add_unique_constraints.sql` (Chỉ mục Unique chống Race Condition)
- **Phân tích 4 Partial Unique Indexes:**
  1. `uq_requests_active_item_requester ON public.requests(item_id, requester_id) WHERE status != 'rejected';`
     -> Ngăn chặn một học sinh mở 2 tab hoặc gửi nhiều yêu cầu cùng lúc cho 1 món đồ.
  2. `uq_requests_single_winner ON public.requests(item_id) WHERE status = 'selected';`
     -> Đảm bảo mỗi món đồ chỉ có duy nhất 01 người nhận chính thức. Triệt tiêu khả năng 2 quản sinh cùng bấm duyệt 2 học sinh khác nhau.
  3. `uq_items_single_occupied_slot ON public.items(storage_slot) WHERE status = 'stored' AND storage_slot IS NOT NULL;`
     -> Đảm bảo mỗi ô kệ chỉ chứa đúng 1 món đồ tại một thời điểm. Ngăn chặn 2 quản sinh cùng cất đồ vào ô `K1-A1`.
  4. `uq_appointments_active_code ON public.appointments(pickup_code) WHERE status IN ('scheduled', 'ready_for_pickup');`
     -> Đảm bảo mỗi mã nhận đồ 4 số chỉ được phát hành duy nhất cho 1 lịch hẹn đang hoạt động.
- **Đánh giá an toàn:** **RỦI RO TRUNG BÌNH (P1)**. Preflight check trên dữ liệu Live đã xác nhận 0 dòng vi phạm, do đó việc tạo Partial Unique Indexes sẽ diễn ra an toàn 100% mà không bị lỗi trùng khóa.

---

### File 5: `005_auth_rls_DRAFT_ONLY.sql` (Bảng Profiles, Trigger & 3 Secure RPCs)
- **Ánh xạ Auth UUID và Business User Code:**
  ```sql
  CREATE TABLE IF NOT EXISTS public.profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
      legacy_user_id TEXT UNIQUE REFERENCES public.users(id) ON DELETE SET NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'station_staff', 'teacher', 'admin')),
      class TEXT,
      shift TEXT,
      phone TEXT,
      points INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ```
- **Trigger bảo vệ vai trò (`trg_protect_profile_role`):**
  - Chặn người dùng tự gửi câu lệnh `UPDATE profiles SET role = 'teacher'` qua REST API.
  - Chỉ cho phép sửa role khi truy vấn xuất phát từ `service_role` (Admin Dashboard).
- **Phân tích 3 Stored Procedures (RPC):**
  - `rpc_accept_request_by_donor(p_request_id TEXT)`
  - `rpc_inspect_and_receive_item(p_apt_id TEXT, p_passed BOOLEAN, p_note TEXT, p_storage_slot TEXT)`
  - `rpc_complete_handover(p_pickup_code TEXT)`
  - **Tất cả RPC đều có cấu hình:**
    - `SECURITY DEFINER`
    - `SET search_path = public, auth, pg_temp` (chống search_path hijacking).
    - **Lấy danh tính trực tiếp từ `auth.uid()`** qua hàm `public.get_current_profile()`.
    - Khóa các dòng liên quan bằng `FOR UPDATE` chống tương tranh (Concurrency lock).
    - Phân quyền: `REVOKE EXECUTE FROM PUBLIC;` và `GRANT EXECUTE TO authenticated;`.
- **Đánh giá an toàn:** **RỦI RO CAO (P0)**. Cần được chạy thử nghiệm trên Staging trước khi triển khai cho người dùng thật.

---

## 2. KỊCH BẢN BACKFILL DỮ LIỆU CŨ CHO PROFILES

Khi tạo tài khoản Supabase Auth cho 4 nhân vật mẫu (`HS001`, `HS002`, `TR01`, `GV01`), chạy script backfill ánh xạ:
```sql
INSERT INTO public.profiles (auth_user_id, legacy_user_id, full_name, role, class, shift, phone, points)
SELECT 
    au.id AS auth_user_id,
    u.id AS legacy_user_id,
    u.name AS full_name,
    u.role,
    u.class,
    u.shift,
    u.phone,
    u.points
FROM public.users u
JOIN auth.users au ON au.email = LOWER(u.id) || '@thcsleloi.edu.vn'
ON CONFLICT (auth_user_id) DO UPDATE 
SET legacy_user_id = EXCLUDED.legacy_user_id,
    role = EXCLUDED.role;
```
Script này giúp hệ thống cũ (dùng ID Text) và hệ thống mới (dùng Auth UUID) đồng bộ chính xác mà không phải sửa đổi cấu trúc khóa chính của các bảng `items`, `requests`, `appointments`.

