# 02_DATABASE_CURRENT_VS_TARGET.md: ĐỐI CHIẾU KIẾN TRÚC HIỆN TẠI VÀ MỤC TIÊU
**Dự án:** LÊ LỢI LOOP  
**Giai đoạn:** Giai đoạn 1 - Lập Kế hoạch Migration Kiến trúc  
**Mục tiêu cuối:** Hệ thống Cloud đa người dùng chạy Pilot 3–5 thiết bị, 10–30 tài khoản thử nghiệm an toàn trong 48 giờ.  

---

## 1. BẢNG MA TRẬN SO SÁNH TỔNG QUAN

| Tiêu chí kiến trúc | Trạng thái hiện tại (CURRENT) | Kiến trúc mục tiêu (TARGET) | Khoảng cách & Giải pháp kỹ thuật |
| :--- | :--- | :--- | :--- |
| **Bảng dữ liệu** | 5 bảng: `users`, `items`, `requests`, `appointments`, `logs`. | 8 bảng: Thêm `notifications`, `station_slots`, `storage_assignments`. | Tạo bảng mới theo hướng **Additive** (không DROP, không đổi tên bảng cũ). |
| **Kiểu dữ liệu Khóa chính (PK)** | Chuỗi `TEXT` tự tăng hoặc sinh mã (`M001`, `HS001`, `REQ-001`). | **Giữ nguyên kiểu TEXT** để tương thích 100% frontend; hỗ trợ UUID mặc định `gen_random_uuid()::text`. | **Không ép đổi sang UUID nhị phân** ở giai đoạn 1 để tránh phá vỡ giao diện đang chạy. |
| **Ràng buộc chống gửi trùng** | Hoàn toàn dựa vào nút bấm UI (`ItemDetailPage.jsx:61`). Database không có Unique constraint. | Partial Unique Index `uq_requests_active_unique`: Một học sinh chỉ có tối đa 1 yêu cầu đang hoạt động trên 1 món đồ. | Ngăn chặn race condition hoặc mở 2 tab gửi trùng lặp ở tầng DB. |
| **Ràng buộc 1 người nhận chính thức** | Cập nhật thủ công hoặc chạy bốc thăm bọc trong `Promise.all`. | Partial Unique Index: Chỉ cho phép duy nhất 1 bản ghi có `status = 'selected'` cho mỗi `item_id`. | Loại bỏ hoàn toàn lỗi gán 2 người cùng trúng 1 món đồ. |
| **Quản lý ô kệ Trạm Phòng Đội** | Cột `storage_slot TEXT` trong bảng `items` và `appointments`. | Thêm bảng chuyên trách `storage_assignments` hoặc Partial Unique Index trên `items(storage_slot) WHERE status = 'stored'`. | Chống việc 2 quản sinh cùng gán trùng 1 ô kệ (`K1-A1` đến `K1-B5`). |
| **Chuông thông báo (Notifications)**| Lưu trong `localStorage` của trình duyệt hiện tại. Bảng trên Cloud bị lỗi 404. | Bảng `public.notifications` đồng bộ qua Supabase Realtime, chỉ người nhận mới đọc được. | Đảm bảo Học sinh A gửi request thì Học sinh B reo chuông thông báo qua Cloud trong 0.5s. |
| **Giao dịch đa bảng (Transactions)**| Frontend gọi nhiều lệnh update song song (`Promise.all`). | Các hàm PostgreSQL Stored Procedure (RPC) thực thi trong khối `BEGIN ... COMMIT` nguyên tử. | Bảo vệ dữ liệu khi mất mạng giữa chừng; dữ liệu không bao giờ bị dở dang (inconsistent). |
| **Xác thực & Bảo mật RLS** | Mở toàn bộ quyền ghi/xóa cho Anon Key (`USING true WITH CHECK true`). | RLS siết chặt theo `auth.uid()`; bảo mật mã nhận đồ; RPC xác thực quyền từ DB. | Học sinh không thể xem/sửa đồ của người khác; không lộ mã nhận đồ. |

---

## 2. CHI TIẾT BẢNG MỚI ĐỀ XUẤT (ADDITIVE SCHEMA EXTENSIONS)

### 2.1. Bảng `public.notifications` (Đồng bộ thông báo Cloud)
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

### 2.2. Bảng `public.station_slots` (Quản lý 10 ô kệ lưu trữ tại Phòng Đội)
Thay vì hardcode mảng `["K1-A1", "K1-A2", ..., "K1-B5"]` trong frontend:
```sql
CREATE TABLE IF NOT EXISTS public.station_slots (
    id TEXT PRIMARY KEY,               -- 'K1-A1', 'K1-A2', ...
    shelf_zone TEXT NOT NULL,          -- 'Khu A', 'Khu B'
    slot_number INTEGER NOT NULL,      -- 1, 2, 3, 4, 5
    max_dimensions TEXT,               -- '30x40x20 cm'
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'maintenance'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.3. Bảng `public.storage_assignments` (Lịch sử lưu vết gán ô kệ trạm)
Lưu vết rõ ràng ai gán ô kệ, thời điểm cất vào, thời điểm lấy ra:
```sql
CREATE TABLE IF NOT EXISTS public.storage_assignments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    slot_id TEXT NOT NULL REFERENCES public.station_slots(id) ON DELETE RESTRICT,
    item_id TEXT NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    appointment_id TEXT REFERENCES public.appointments(id) ON DELETE SET NULL,
    assigned_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'occupied', -- 'occupied', 'released'
    occupied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    released_at TIMESTAMPTZ,
    notes TEXT
);
```

---

## 3. CÁC CHỈ MỤC VÀ RÀNG BUỘC TOÀN VẸN MỤC TIÊU (INDEXES & CONSTRAINTS)

1. **Ràng buộc duy nhất trên Yêu cầu (`requests`):**
   ```sql
   CREATE UNIQUE INDEX IF NOT EXISTS uq_requests_active_item_requester 
   ON public.requests(item_id, requester_id) 
   WHERE status != 'rejected';
   ```
2. **Ràng buộc duy nhất 1 người nhận chính thức (`requests`):**
   ```sql
   CREATE UNIQUE INDEX IF NOT EXISTS uq_requests_single_winner 
   ON public.requests(item_id) 
   WHERE status = 'selected';
   ```
3. **Ràng buộc duy nhất trên Ô kệ lưu trữ (`items`):**
   ```sql
   CREATE UNIQUE INDEX IF NOT EXISTS uq_items_single_occupied_slot 
   ON public.items(storage_slot) 
   WHERE status = 'stored' AND storage_slot IS NOT NULL;
   ```
4. **Chỉ mục tối ưu Foreign Keys (Tránh Full Table Scan):**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_requests_item_id ON public.requests(item_id);
   CREATE INDEX IF NOT EXISTS idx_requests_requester_id ON public.requests(requester_id);
   CREATE INDEX IF NOT EXISTS idx_appointments_item_id ON public.appointments(item_id);
   CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, is_read);
   ```

