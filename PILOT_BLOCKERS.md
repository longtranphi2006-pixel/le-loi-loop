# DANH SÁCH CÁC ĐIỂM CHẶN (BLOCKERS) VÀ HƯỚNG DẪN THIẾT LẬP STAGING
**Dự án:** LÊ LỢI LOOP — THCS LÊ LỢI ĐÀ NẴNG  
**Ngày cập nhật:** 30/10/2026  

---

## I. CÁC ĐIỂM CHẶN KỸ THUẬT HIỆN TẠI (PILOT BLOCKERS)

Dù mã nguồn frontend đã được chuẩn hóa và biên dịch 100% không lỗi, hệ thống vẫn **CHƯA THỂ CHẠY THỬ NGHIỆM ĐA THIẾT BỊ HOÀN CHỈNH** nếu chưa giải quyết 4 điểm chặn hạ tầng sau:

### 1. Block 1: Bảng `public.notifications` chưa tồn tại trên Database Cloud
- **Triệu chứng:** Khi người dùng gửi yêu cầu nhận đồ hoặc chấp thuận yêu cầu, hàm `createNotification()` gọi `supabase.from('notifications').insert(...)` sẽ trả về lỗi HTTP 404 (mã Postgres `PGRST205: relation "public.notifications" does not exist`).
- **Hệ quả:** Chuông thông báo trên thanh Navbar không thể reo giữa 2 thiết bị khác nhau qua mạng.
- **Biện pháp tháo gỡ:** Chạy migration `002_add_notifications.sql` trên Supabase SQL Editor.

### 2. Block 2: 3 Stored Procedures (RPC) chưa được nạp lên Database
- **Triệu chứng:** Khi người cho chấp thuận yêu cầu (`rpc_accept_request_by_donor`), quản sinh kiểm định lưu kệ (`rpc_inspect_and_receive_item`), hoặc bàn giao đồ (`rpc_complete_handover`), Supabase trả về lỗi không tìm thấy function.
- **Hệ quả:** Frontend theo chuẩn Cloud-First mới sẽ dừng lại và báo lỗi giao dịch RPC, không cho phép lưu dữ liệu dở dang để bảo vệ database.
- **Biện pháp tháo gỡ:** Chạy bản thảo `005_auth_rls_DRAFT_ONLY.sql` trên môi trường Supabase Staging.

### 3. Block 3: Cấu hình Xác thực Email trên Supabase Dashboard đang BẬT (`mailer_autoconfirm: false`)
- **Triệu chứng:** Khi tạo tài khoản thử nghiệm cho học sinh hoặc giáo viên qua Supabase Auth, hệ thống gửi email xác nhận. Do học sinh THCS không có hộp thư cá nhân hoạt động thật, tài khoản bị treo ở trạng thái `unconfirmed_email`. Khi đăng nhập sẽ gặp lỗi `Email not confirmed`.
- **Biện pháp tháo gỡ:** Quản trị viên truy cập **Supabase Dashboard -> Authentication -> Providers -> Email** và **TẮT tùy chọn "Confirm email"** (hoặc bật Auto-confirm).

### 4. Block 4: Chưa có môi trường Supabase Staging độc lập
- **Nguyên tắc an toàn:** Tuyệt đối không chạy migration thử nghiệm trực tiếp trên database đang chứa dữ liệu của nhà trường.
- **Biện pháp tháo gỡ:** Tạo 1 project Supabase Staging miễn phí hoặc sử dụng Supabase Local CLI trên Docker để kiểm chứng toàn bộ 5 file migration trước.

---

## II. HƯỚNG DẪN THIẾT LẬP MÔI TRƯỜNG STAGING VÀ CHẠY THỬ NGHIỆM ĐỘC LẬP

### Bước 1: Tạo Project Supabase Staging
1. Truy cập [supabase.com](https://supabase.com) và đăng nhập.
2. Chọn **New Project**, đặt tên: `le-loi-loop-staging`, chọn khu vực: `Singapore (ap-southeast-1)`.
3. Lưu lại `Project URL` và `anon key`.

### Bước 2: Tắt xác nhận Email cho tài khoản thử nghiệm
1. Trong Dashboard của project staging, vào mục **Authentication** -> **Providers** -> **Email**.
2. Bỏ chọn **"Confirm email"** (Set thành False).
3. Bấm **Save**.

### Bước 3: Chạy 5 Migration SQL theo đúng thứ tự
Vào mục **SQL Editor** trong Dashboard và lần lượt paste nội dung của 5 file migration:
1. `upgrade_plan/migrations/001_preflight_checks.sql` (Kiểm tra dữ liệu sạch).
2. `upgrade_plan/migrations/002_add_notifications.sql` (Tạo bảng chuông thông báo Realtime).
3. `upgrade_plan/migrations/003_add_station_storage.sql` (Tạo bảng 10 ô kệ trạm Phòng Đội).
4. `upgrade_plan/migrations/004_add_unique_constraints.sql` (Tạo 4 chỉ mục Unique chống gửi trùng và chiếm ô kệ).
5. `upgrade_plan/migrations/005_auth_rls_DRAFT_ONLY.sql` (Tạo bảng profiles, trigger bảo vệ vai trò và 3 RPC giao dịch nguyên tử).

### Bước 4: Tạo 4 Tài khoản Thử nghiệm trên Supabase Auth
Vào mục **Authentication** -> **Users** -> **Add user** -> **Create user**:
- **Tài khoản 1 (Học sinh cho):** `hs001@thcsleloi.edu.vn` (Mật khẩu tự chọn an toàn).
- **Tài khoản 2 (Học sinh nhận):** `hs002@thcsleloi.edu.vn` (Mật khẩu tự chọn an toàn).
- **Tài khoản 3 (Quản sinh trạm):** `tr01@thcsleloi.edu.vn` (Mật khẩu tự chọn an toàn).
- **Tài khoản 4 (Giáo viên KHKT):** `gv01@thcsleloi.edu.vn` (Mật khẩu tự chọn an toàn).

### Bước 5: Cấu hình biến môi trường trên máy kiểm thử
Mở file `.env` trên máy tính hoặc cấu hình trên Vercel Preview:
```env
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-staging-anon-key
```

### Bước 6: Khởi chạy và Nghiệm thu
```bash
npm run build
npm run dev
```
Mở 3 trình duyệt khác nhau (hoặc 1 máy tính và 2 điện thoại cùng mạng WiFi):
- Thiết bị 1 đăng nhập `hs001` (Bảo An - HS Cho).
- Thiết bị 2 đăng nhập `hs002` (Hoàng Nam - HS Nhận).
- Thiết bị 3 đăng nhập `tr01` (Quản sinh Trạm).
Chạy trọn vẹn chu trình trao nhận đồ và chụp ảnh biên bản nghiệm thu trước Ban Giám khảo.

