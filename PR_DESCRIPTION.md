# PULL REQUEST: Chuyển đổi kiến trúc sang Cloud Multi-User Pilot (Lê Lợi Loop)
**Branch đề xuất:** `fix/cloud-multi-user-pilot` -> `main`  
**Loại thay đổi:** Kiến trúc hệ thống, Quản lý trạng thái, Bảo mật & Cơ sở dữ liệu  
**Mục tiêu:** Cho phép 2–3 thiết bị độc lập (điện thoại, máy tính học sinh, máy tính phòng Đội) đồng bộ dữ liệu thời gian thực trong 48 giờ thử nghiệm.

---

## 1. TÓM TẮT THAY ĐỔI MÃ NGUỒN (FILES CHANGED)

| File thay đổi | Loại thay đổi | Lý do và mục đích kỹ thuật |
| :--- | :---: | :--- |
| [`src/context/AppContext.jsx`](file:///d:/Lê Lợi Loop/src/context/AppContext.jsx) | **Refactor Core** | • Biến Supabase thành Single Source of Truth.<br>• Khi Cloud trả về `[]`, state cập nhật về `[]` (không giữ seed data cũ).<br>• Hiển thị trạng thái đồng bộ minh bạch (`synced`, `syncing`, `sync_error`).<br>• Bỏ cơ chế đếm `items.length + 1`, chuyển sang sinh ID ngẫu nhiên phân tán `genId()` chống xung đột PK.<br>• Kết nối bảng `notifications` vào Cloud Realtime.<br>• Tích hợp gọi Stored Procedure RPC cho các giao dịch nguyên tử. |
| [`src/lib/supabase.js`](file:///d:/Lê Lợi Loop/src/lib/supabase.js) | **Configuration** | Bật `persistSession: true` và `autoRefreshToken: true` để lưu phiên đăng nhập thực tế của Supabase Auth qua F5. |
| [`src/components/ProtectedRoute.jsx`](file:///d:/Lê Lợi Loop/src/components/ProtectedRoute.jsx) | **New Component** | Route Guard bảo vệ trang Quản trị `/admin`, chuyển hướng học sinh không có quyền về trang chủ. |
| [`src/App.jsx`](file:///d:/Lê Lợi Loop/src/App.jsx) | **Routing & UX** | Bọc trang Quản trị bằng `ProtectedRoute`, hiển thị Banner cảnh báo khi mất kết nối Cloud (`sync_error`). |
| [`src/components/RoleSwitcher.jsx`](file:///d:/Lê Lợi Loop/src/components/RoleSwitcher.jsx) | **Auth Upgrade** | Hỗ trợ đăng nhập nhanh vào tài khoản thật của Supabase Auth cho các vai trò `HS001`, `HS002`, `GV01`, `TR01`, hiển thị chi tiết trạng thái kết nối Cloud. |
| [`MIGRATIONS/20261030_cloud_multi_user_pilot.sql`](file:///d:/Lê Lợi Loop/MIGRATIONS/20261030_cloud_multi_user_pilot.sql) | **Database** | File migration idempotent chứa DDL bảng `notifications`, các Unique Index chống race condition và 3 hàm RPC ACID. |

---

## 2. PHỤ THUỘC MIGRATION (DATABASE DEPENDENCY)

PR này phụ thuộc vào việc áp dụng script SQL trong file:  
`MIGRATIONS/20261030_cloud_multi_user_pilot.sql`

> [!WARNING]
> **Lưu ý an toàn:**
> - Code frontend đã được thiết kế **tương thích ngược (Graceful Fallback)**: Nếu quản trị viên chưa kịp chạy script migration trên Supabase, các hàm frontend sẽ tự động fallback sang cơ chế query bảng trực tiếp mà không làm sập ứng dụng.
> - Tuy nhiên, để có đầy đủ tính năng chống Race Condition ô kệ và thông báo Cloud, cần chạy migration trên Supabase Dashboard.

---

## 3. ĐÁNH GIÁ RỦI RO & KHẢ NĂNG TƯƠNG THÍCH (RISK ASSESSMENT)

1. **Rủi ro mất kết nối mạng tại phòng thi KHKT:**
   - *Biện pháp giảm thiểu:* Hệ thống giữ LocalStorage làm tầng đệm ngoại tuyến (Offline Cache). Khi mất mạng, cờ `syncStatus` chuyển sang `offline`, người dùng vẫn xem được các dữ liệu đã tải trước đó.
2. **Rủi ro tài khoản Supabase Auth chưa được kích hoạt:**
   - *Biện pháp giảm thiểu:* RoleSwitcher vẫn cho phép chọn tài khoản mẫu tức thì, đồng thời tự động đồng bộ ID người dùng với các giao dịch tạo mới.
3. **Rủi ro xung đột dữ liệu lịch sử:**
   - Các index mới (`uq_requests_item_requester`, `uq_items_occupied_slot`) chỉ áp dụng cho các bản ghi đang hoạt động (`active`), không làm hỏng dữ liệu lịch sử đã hoàn thành (`completed`).

---

## 4. QUY TRÌNH TRIỂN KHAI THỦ CÔNG (MANUAL DEPLOYMENT STEPS)

### Bước 1: Áp dụng Migration lên Supabase Dashboard
1. Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard).
2. Chọn dự án `vepuogmvrnhpwneufjff`.
3. Mở menu **SQL Editor**.
4. Dán toàn bộ nội dung từ file [`MIGRATIONS/20261030_cloud_multi_user_pilot.sql`](file:///d:/Lê Lợi Loop/MIGRATIONS/20261030_cloud_multi_user_pilot.sql).
5. Nhấn **Run** và kiểm tra kết quả thông báo `Success. No rows returned`.

### Bước 2: Kiểm tra chức năng Realtime
1. Vào menu **Database** -> **Replication**.
2. Đảm bảo bảng `notifications`, `items`, `requests`, `appointments` đã được tích xanh trong `supabase_realtime`.

### Bước 3: Build và Kiểm tra Frontend
1. Chạy `npm run build` trên máy lập trình.
2. Kiểm tra bundle không phát sinh lỗi cú pháp hay thiếu import.

---

## 5. KẾ HOẠCH HOÀN TÁC (ROLLBACK PLAN)

Nếu xảy ra sự cố trong quá trình thử nghiệm 48 giờ:
1. **Frontend:** Chuyển lại branch `main` bằng lệnh:
   ```powershell
   git checkout main
   ```
2. **Database:** Mở Supabase SQL Editor và thực thi phần rollback ở cuối file migration:
   ```sql
   DROP INDEX IF EXISTS uq_requests_item_requester;
   DROP INDEX IF EXISTS uq_items_occupied_slot;
   DROP FUNCTION IF EXISTS public.rpc_accept_request_by_donor(TEXT, TEXT);
   DROP FUNCTION IF EXISTS public.rpc_inspect_and_receive_item(TEXT, BOOLEAN, TEXT, TEXT, TEXT);
   DROP FUNCTION IF EXISTS public.rpc_complete_handover(TEXT, TEXT);
   ```
