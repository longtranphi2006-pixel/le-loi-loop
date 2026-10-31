# BÁO CÁO KIỂM TOÁN CHUYÊN SÂU HỆ THỐNG LÊ LỢI LOOP
**Dự án:** LÊ LỢI LOOP - Nền tảng tuần hoàn đồ dùng học tập THCS Lê Lợi  
**Mục tiêu:** Chuyển đổi mô hình từ Hybrid LocalStorage/Supabase sang Cloud đa người dùng quy mô nhỏ (Pilot 2–3 thiết bị độc lập trong 48 giờ)  
**Branch thực hiện:** `fix/cloud-multi-user-pilot`  
**Ngày kiểm toán:** 30/10/2026  
**Chuyên viên thực hiện:** Senior QA Engineer & Full-stack Architect  

---

## 1. TỔNG QUAN TÌNH TRẠNG HIỆN TẠI (EXECUTIVE SUMMARY)

Hệ thống **LÊ LỢI LOOP** đã có logic nghiệp vụ chi tiết (thuật toán ghép lịch LoopMatch, bốc thăm LCG, quy trình bàn giao Phòng Đội, quản lý kho 10 ô kệ). Tuy nhiên, về mặt kiến trúc dữ liệu và đồng bộ:

- **Bản chất hiện tại:** Là một ứng dụng **Client-Side SPA dựa trên LocalStorage** kết hợp với các lệnh ghi song song (dual-write) lên Supabase mà **không có tính toàn vẹn phân tán**.
- **Tính xác thực (Authentication):** Hoàn toàn giả lập qua `RoleSwitcher.jsx` (đổi biến `currentUser` lưu trong `localStorage`). Không có token JWT phiên làm việc, không có session trên Cloud.
- **Tính đồng bộ đa thiết bị:** Nếu mở trên 2 máy tính độc lập, máy A đăng đồ hoặc xin đồ thì máy B không nhận được thông báo; nếu cả 2 máy cùng thao tác sẽ bị xung đột khóa chính do cơ chế tự đếm `items.length + 1`.
- **An toàn bảo mật:** Row Level Security (RLS) đang mở hoàn toàn `USING (true) WITH CHECK (true)` cho role `anon`, bất kỳ ai cũng có thể đọc/ghi/xóa dữ liệu. Trang `/admin` không có Route Guard bảo vệ.

---

## 2. BẢNG PHÂN LOẠI LỖI THEO MỨC ĐỘ ƯU TIÊN (P0 / P1 / P2)

| Mã lỗi | Phân loại | Mức độ | Hiện trạng & Bằng chứng mã nguồn | Phương pháp xác minh |
| :--- | :---: | :---: | :--- | :---: |
| **BUG-01** | **P0** | **Kiến trúc dữ liệu** | **Cloud trả mảng rỗng `[]` nhưng client vẫn giữ dữ liệu seed cũ:** Trong `AppContext.jsx:144-168`, điều kiện `if (itemsRes.data.length > 0)` khiến cho khi Database Supabase bị xóa sạch hoặc trả về rỗng, client không cập nhật về rỗng mà vẫn giữ dữ liệu mẫu cũ. | **CODE ANALYSIS** |
| **BUG-02** | **P0** | **Bảo mật & RLS** | **Toàn bộ RLS mở công khai cho `anon` key:** Trong `supabase_schema.sql:100-140`, toàn bộ policy dùng `USING (true) WITH CHECK (true)` cho `anon`. Không kiểm tra `auth.uid()`. | **CODE & LIVE VERIFIED** |
| **BUG-03** | **P0** | **Toàn vẹn dữ liệu** | **Xung đột khóa chính (Primary Key Collision):** Trong `AppContext.jsx:369-370` và `463-464`, ID sinh bằng `items.length + 1` (`M013`) và `requests.length + 1` (`REQ-006`). Nếu 2 thiết bị cùng đăng đồ, thiết bị thứ 2 chắc chắn bị lỗi Postgres Duplicate Key (23505). | **CODE ANALYSIS** |
| **BUG-04** | **P0** | **Thiếu bảng Cloud** | **Bảng `notifications` không tồn tại trên Supabase:** Code gọi `supabase.from('notifications').insert(...)` tại `AppContext.jsx:337`, nhưng bảng không có trong `supabase_schema.sql` và trả về `404 PGRST205` khi truy vấn. | **VERIFIED LIVE (REST API)** |
| **BUG-05** | **P0** | **Phân quyền** | **Trang Quản trị `/admin` không có Route Guard:** Trong `App.jsx:108-113`, component `AdminDashboardPage` render khi `activePage === 'admin'` mà không kiểm tra role. Học sinh `HS001` có thể truy cập toàn bộ quyền duyệt đồ, bốc thăm và bàn giao. | **CODE ANALYSIS** |
| **BUG-06** | **P0** | **Transaction** | **Cập nhật đa bảng không Transaction:** Các hàm `confirmAppointment`, `inspectAndReceiveItem`, `completeHandover`, `acceptRequestByDonor` dùng `Promise.all` riêng lẻ. Nếu bảng 1 thành công mà bảng 2 lỗi mạng, dữ liệu rơi vào trạng thái bất nhất (inconsistent). | **CODE ANALYSIS** |
| **BUG-07** | **P1** | **Xử lý ngoại lệ** | **Nuốt lỗi Cloud (Silent Swallowing) & Báo thành công giả:** Trong `AppContext.jsx:387-395`, `showNotification('Đăng món thành công!')` được gọi trước khi ghi Cloud. Khối `catch (err)` chỉ in `console.error`, người dùng tưởng đã lưu lên Cloud nhưng thực tế chỉ nằm trong LocalStorage. | **CODE ANALYSIS** |
| **BUG-08** | **P1** | **Ràng buộc nghiệp vụ** | **Không chống duplicate request ở Database:** Bảng `requests` chỉ có PK `id`, không có `UNIQUE (item_id, requester_id)`. Chống trùng chỉ nằm ở nút bấm UI (`ItemDetailPage.jsx:61`). | **CODE & LIVE VERIFIED** |
| **BUG-09** | **P1** | **Race Condition** | **Không có ràng buộc chống 2 món chiếm cùng ô kệ:** Cột `storage_slot` trong `items` và `appointments` không có partial unique index. Hai quản sinh thao tác đồng thời có thể gán cùng ô `K1-A1`. | **CODE & LIVE VERIFIED** |
| **BUG-10** | **P1** | **Bàn giao trùng lặp** | **Khả năng gọi bàn giao trùng lặp:** `completeHandover` chỉ kiểm tra `apt.status === 'completed'` trên bộ nhớ RAM. Không có khóa dòng (Row lock `FOR UPDATE`) ở DB để chống 2 thiết bị cùng nhập mã cùng lúc. | **CODE ANALYSIS** |
| **BUG-11** | **P2** | **Xác thực phiên** | **Client Supabase cấu hình `persistSession: false`:** Trong `src/lib/supabase.js:17`, cờ này tắt cơ chế ghi nhớ token đăng nhập Supabase Auth trên trình duyệt. | **CODE ANALYSIS** |
| **BUG-12** | **P2** | **Tải tài nguyên** | **Ảnh đồ dùng chưa dùng Supabase Storage:** Form đăng đồ dùng ảnh preset mẫu hoặc link ảnh ngoài, chưa có bucket lưu trữ ảnh thực tế. | **CODE ANALYSIS** |

---

## 3. KẾT QUẢ KIỂM TRA TRỰC TIẾP SUPABASE LIVE (READ-ONLY PROBE)

*Thực hiện qua REST API với Anon Key công khai tại URL: `https://vepuogmvrnhpwneufjff.supabase.co`*

| Mục kiểm tra | Trạng thái Live | Chi tiết ghi nhận |
| :--- | :---: | :--- |
| **Bảng `users`** | **VERIFIED LIVE** | HTTP 200 OK. Các cột: `id`, `name`, `role`, `class`, `shift`, `avatar`, `phone`, `points`, `bio`, `created_at`. |
| **Bảng `items`** | **VERIFIED LIVE** | HTTP 200 OK. Các cột: `id`, `title`, `category`, `condition`, `description`, `donor_id`, `donor_name`, `available_slots`, `input_method`, `status`, `request_status`, `image`, `quality_check`, `storage_slot`, `reject_reason`, `update_note`, `created_at`. |
| **Bảng `requests`** | **VERIFIED LIVE** | HTTP 200 OK. Các cột: `id`, `item_id`, `requester_id`, `requester_name`, `requester_class`, `reason`, `available_slots`, `input_method`, `status`, `lottery_rank`, `created_at`. |
| **Bảng `appointments`** | **VERIFIED LIVE** | HTTP 200 OK. Các cột: `id`, `item_id`, `request_id`, `donor_id`, `requester_id`, `type`, `donor_slot`, `requester_slot`, `storage_slot`, `pickup_code`, `status`, `donor_arrived_at`, `picked_up_at`, `notes`, `created_at`. |
| **Bảng `logs`** | **VERIFIED LIVE** | HTTP 200 OK. Các cột: `id`, `timestamp`, `role`, `action`, `details`, `created_at`. |
| **Bảng `notifications`** | **VERIFIED LIVE** | **HTTP 404 Not Found (PGRST205)**: `Could not find the table 'public.notifications' in the schema cache`. Bảng chưa được tạo. |
| **Bảng hệ thống `pg_publication_tables`** | **NOT VERIFIED LIVE** | PostgREST không cho phép quyền `anon` truy vấn trực tiếp danh mục nội bộ `pg_catalog`. Cần tài khoản quản trị DB để xác minh publication. |
| **Chính sách RLS chi tiết nội bộ** | **CODE ANALYSIS** | Dựa trên file `supabase_schema.sql`, tất cả chính sách đang mở hoàn toàn `USING (true)` cho `public/anon`. |

---

## 4. CHI TIẾT CÁC ĐIỂM SỬA ĐỔI KIẾN TRÚC ĐỀ XUẤT (DESIGN SPEC)

1. **Supabase là Single Source of Truth:**
   - Trạng thái dữ liệu được quản lý tập trung: `syncStatus` gồm 4 trạng thái minh bạch: `synced` (xanh), `syncing` (xoay), `sync_error` (đỏ/cam), `offline`.
   - Nếu Cloud trả về `[]`, ứng dụng cập nhật state về `[]`, không hiển thị dữ liệu giả lập.
   - Khi Cloud trả lỗi, hiển thị banner cảnh báo và thông báo `sync_error`, tuyệt đối không giả lập thông báo thành công.
2. **Cơ chế sinh ID chống xung đột phân tán:**
   - Sử dụng chuẩn `crypto.randomUUID()` cho khóa chính PostgreSQL.
   - Giữ mã hiển thị ngắn gọn thân thiện học sinh (`display_code`: `M-xxxx`, `REQ-xxxx`, `APT-xxxx`, `LOOP-xxxx`).
3. **Bảo mật và Xác thực (Authentication & Authorization):**
   - Hỗ trợ tài khoản Supabase Auth thật (`HS001@leloiloop.edu.vn`, `HS002@leloiloop.edu.vn`, `GV01@leloiloop.edu.vn`, `TR01@leloiloop.edu.vn`).
   - Tạo component `ProtectedRoute.jsx` ngăn học sinh truy cập `/admin`.
   - Tách biệt rõ giữa chế độ **Pilot Cloud Multi-User** và chế độ **KHKT Quick Demo Switcher**.
4. **Tính toàn vẹn giao dịch (ACID Transactions):**
   - Đề xuất 3 hàm PostgreSQL Stored Procedure / RPC:
     - `rpc_accept_request_by_donor`: Chốt người nhận, chuyển các bạn khác thành dự phòng, đổi trạng thái món đồ, gửi thông báo Cloud chỉ trong 1 giao dịch.
     - `rpc_inspect_and_receive_item`: Kiểm tra ô kệ trống trước khi gán (chống race condition 2 người gán 1 ô), đổi trạng thái lịch hẹn và món đồ.
     - `rpc_complete_handover`: Kiểm tra tính hợp lệ của mã nhận, khóa dòng giao dịch, giải phóng kệ và đổi trạng thái completed.

