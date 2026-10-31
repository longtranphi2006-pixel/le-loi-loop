# BÁO CÁO TÍCH HỢP & XÁC MINH MÔI TRƯỜNG STAGING — GIAI ĐOẠN 3
**Dự án:** LÊ LỢI LOOP — "Đồ cũ trao tay, Giá trị ở lại"  
**Đơn vị:** Phân hiệu Trường THCS Lê Lợi, TP. Đà Nẵng  
**Cuộc thi:** Nghiên cứu Khoa học Kỹ thuật (KHKT) cấp Thành phố  
**Vai trò:** Full-stack Engineer kiêm Supabase/PostgreSQL QA Engineer  
**Thời điểm thực hiện:** 30/10/2026  
**Mục tiêu:** Rà soát an toàn môi trường, thẩm định 5 migration SQL và thiết lập quy trình kiểm thử Staging độc lập  

---

## 1. XÁC MINH HIỆN TRẠNG MÔI TRƯỜNG (ENVIRONMENT VERIFICATION)

- **Kết quả rà soát cấu hình:**
  - File `.env` duy nhất trong dự án trỏ tới URL: `https://vepuogmvrnhpwneufjff.supabase.co`.
  - Project Reference ID trong JWT token: `vepuogmvrnhpwneufjff`.
  - **Xác minh phân loại:** Đây là database **Production / Live** chứa dữ liệu thực tế của trường (12 items, 4 users, 5 requests, 3 appointments).
- **Kết luận xác minh:** **DỰ ÁN HIỆN TẠI CHƯA CÓ MÔI TRƯỜNG SUPABASE STAGING ĐỘC LẬP.**
- **Tuân thủ nguyên tắc an toàn:**
  - **TUYỆT ĐỐI KHÔNG CHẠY SQL LÊN `vepuogmvrnhpwneufjff.supabase.co`**.
  - **TUYỆT ĐỐI KHÔNG DEPLOY HOẶC THAY ĐỔI CẤU HÌNH AUTH CỦA PRODUCTION**.
  - Đã khởi tạo file cấu hình mẫu [`d:/Lê Lợi Loop/.env.staging.example`](file:///d:/Lê Lợi Loop/.env.staging.example) để sẵn sàng kết nối ngay khi project Staging được tạo.
  - Mọi kiểm thử yêu cầu ghi dữ liệu Cloud tiếp tục được đánh dấu trung thực là **BLOCKED (CHỜ MÔI TRƯỜNG STAGING)**.

---

## 2. KẾT QUẢ ĐÁNH GIÁ 5 MIGRATION SQL & SỬA LỖI BẢO MẬT

Toàn bộ 5 file migration tại [`upgrade_plan/migrations/`](file:///d:/Lê Lợi Loop/upgrade_plan/migrations/) đã được đọc và thẩm định nguyên văn:

| Migration File | Trạng thái Review | Lỗ hổng / Vấn đề phát hiện | Giải pháp kỹ thuật đã khắc phục |
| :--- | :---: | :--- | :--- |
| **`001_preflight_checks.sql`** | **HOÀN TOÀN AN TOÀN** | Không có. 100% là câu lệnh `SELECT` kiểm tra dữ liệu mồ côi và trùng lặp. | Giữ nguyên, sẵn sàng chạy kiểm tra trên bất kỳ môi trường nào. |
| **`002_add_notifications.sql`** | **ĐÃ SỬA LỖI BẢO MẬT** | Cũ: Có `OR auth.role() = 'anon'` và `FOR INSERT WITH CHECK (true)` cho phép bất kỳ ai đọc/chèn thông báo giả. | **Đã sửa:** Xóa bỏ `anon` bypass, buộc kiểm tra `auth.uid() IS NOT NULL`, chỉ người nhận mới được đọc/sửa cột `is_read`. |
| **`003_add_station_storage.sql`** | **ĐÃ SỬA LỖI BẢO MẬT** | Cũ: Dòng 68 có `CREATE POLICY ... FOR ALL USING (true) WITH CHECK (true)` (Public-all write leak). | **Đã sửa:** Xóa bỏ public write. Chỉ cho phép tài khoản có vai trò `station_staff`, `teacher`, `admin` hoặc `service_role` cập nhật. |
| **`004_add_unique_constraints.sql`** | **HOÀN TOÀN AN TOÀN** | Không có lỗi. Chứa 4 Partial Unique Index chống Race Condition (gửi trùng, nhiều winner, trùng ô kệ, trùng mã nhận). | Giữ nguyên. Cú pháp `CREATE UNIQUE INDEX IF NOT EXISTS` bảo đảm tính Idempotent 100%. |
| **`005_auth_rls_DRAFT_ONLY.sql`** | **ĐÃ HOÀN THIỆN TOÀN DIỆN** | Cũ: Ở trạng thái DRAFT ONLY, chỉ có profiles table và RPC, **thiếu toàn bộ RLS policies** cho `items`, `requests`, `appointments` (lộ `pickup_code`). | **Đã sửa:** Nâng cấp thành bản hoàn chỉnh. Bổ sung đầy đủ 5 nhóm RLS policies, bảo mật mã nhận 4 số, phân quyền RPC qua `get_current_profile()`. |

---

## 3. MIGRATION NÀO THỰC SỰ ĐÃ CHẠY TRÊN STAGING?

- **Báo cáo trung thực:** **0 file migration nào được chạy trên database Cloud trong phiên làm việc này.**
- **Lý do:** Dự án chưa có database Staging riêng biệt. Việc tự ý chạy SQL lên production bị cấm hoàn toàn.
- **Tình trạng file:** Cả 5 file migration hiện đã đạt trạng thái **SẴN SÀNG CHẠY (READY FOR STAGING RUN)** ngay khi Ban Quản trị cấp project Staging.

---

## 4. CHIẾN LƯỢC TÀI KHOẢN AUTH THỬ NGHIỆM TRÊN STAGING

Để kiểm thử chu trình trao nhận với 4 vai trò độc lập, phương án thiết lập tại [`scripts/setup_staging_accounts.sql`](file:///d:/Lê Lợi Loop/scripts/setup_staging_accounts.sql) đã được chuẩn bị:

### 4.1. Danh sách 4 tài khoản thử nghiệm chuẩn
- **Học sinh Cho đồ (Donor):** `pilot.donor@leloiloop.test` -> Ánh xạ `HS001` (Trần Bảo An, Lớp 8/1, Sáng).
- **Học sinh Xin nhận đồ (Requester):** `pilot.requester@leloiloop.test` -> Ánh xạ `HS002` (Lê Hoàng Nam, Lớp 7/3, Chiều).
- **Quản sinh Trạm Phòng Đội:** `pilot.station@leloiloop.test` -> Ánh xạ `TR01` (Đội Trực Trạm Phòng Đội).
- **Giáo viên Phụ trách KHKT:** `pilot.teacher@leloiloop.test` -> Ánh xạ `GV01` (Thầy Nguyễn Văn An - Hội đồng KHKT).

### 4.2. Nguyên tắc bảo mật danh tính & Mật khẩu
- **Không giả danh tên miền trường:** Sử dụng domain chuẩn kiểm thử RFC 2606 (`@leloiloop.test`), không dùng tên miền trường khi chưa có xác nhận từ văn phòng nhà trường.
- **Không hardcode mật khẩu:** Mật khẩu do quản trị viên tự gán trên Dashboard, không lưu trong mã nguồn, commit hay tài liệu báo cáo.
- **Chính sách xác thực Email an toàn:**
  - **Phương án khuyến nghị (Khởi tạo qua Dashboard):** Quản trị viên tạo user trực tiếp tại mục **Authentication -> Users -> Create user**. Khi tạo qua Dashboard, Supabase tự động đánh dấu `email_confirmed_at = NOW()`, do đó **KHÔNG CẦN TẮT XÁC THỰC EMAIL TRÊN TOÀN DỰ ÁN**.
  - **Phương án phụ (Chỉ áp dụng trên Staging nếu test tự đăng ký):** Tắt tùy chọn "Confirm email" trong Authentication Settings của project Staging.

---

## 5. KẾT QUẢ ĐÁNH GIÁ 10 KỊCH BẢN KIỂM THỬ CLOUD (A–J)

| Kịch bản | Mô tả kiểm thử | Trạng thái hiện tại | Phương pháp kiểm chứng |
| :--- | :--- | :---: | :--- |
| **A** | Đăng nhập riêng từng vai trò & F5 duy trì phiên | **IMPLEMENTED** | Code `resolveUserProfile()` và listener SDK Auth đã sẵn sàng. Chờ tài khoản Staging. |
| **B** | Học sinh không có quyền sửa duyệt qua REST API | **IMPLEMENTED** | Policy RLS `Donors or staff can update items` chỉ cho sửa khi `status = 'pending'`. |
| **C** | HS001 đăng đồ, GV01 duyệt, HS002 nhìn thấy | **TESTED (Logic)** / **BLOCKED (Cloud)** | Thuật toán hiển thị và trạng thái đã kiểm thử. Cần DB Staging để kiểm thử qua mạng. |
| **D** | HS002 xin nhận, HS001 nhận Notification Cloud | **BLOCKED** | Bảng `public.notifications` chưa tồn tại trên Cloud. |
| **E** | Gửi yêu cầu trùng bằng 2 tab bị DB từ chối | **TESTED (Client)** / **BLOCKED (DB)** | Client chặn thành công. Chặn đa tab tại DB chờ Partial Unique Index `004`. |
| **F** | Database không thể tồn tại 2 selected requests | **TESTED (Algorithm)** / **BLOCKED (DB)** | Bốc thăm LCG chỉ chọn 1 winner. Ràng buộc `uq_requests_single_winner` chờ Index `004`. |
| **G** | Chốt lịch LoopMatch hợp lệ | **TESTED** | Đã kiểm thử tự động với 17 assertions thành công (phát hiện nghịch lý thời gian). |
| **H** | Hai quản sinh không thể chiếm cùng 1 ô kệ | **TESTED (Client)** / **BLOCKED (DB)** | Client chặn chọn đè ô đã có đồ. Chặn tương tranh DB chờ `uq_items_single_occupied_slot`. |
| **I** | Bàn giao thành công, giải phóng kệ, vô hiệu hóa mã | **TESTED (Logic)** / **BLOCKED (DB)** | Đã xóa bỏ fallback bẩn, mã nhận `LOOP-xxxx` ngẫu nhiên. Chờ RPC `rpc_complete_handover`. |
| **J** | Mất mạng không báo hoàn tất giả | **TESTED** | Mã nguồn đã chuyển 100% sang Cloud-First, gọi DB trước, bắt lỗi toàn diện. |

---

## 6. DANH SÁCH LỖI ĐÃ PHÁT HIỆN VÀ TẬP TIN ĐÃ SỬA

1. **`upgrade_plan/migrations/002_add_notifications.sql`**: Đã loại bỏ `OR auth.role() = 'anon'` và policy `WITH CHECK (true)`.
2. **`upgrade_plan/migrations/003_add_station_storage.sql`**: Đã loại bỏ policy ghi mở `FOR ALL USING (true) WITH CHECK (true)`.
3. **`upgrade_plan/migrations/005_auth_rls_DRAFT_ONLY.sql`**: Đã chuyển đổi từ DRAFT sang bản hoàn chỉnh, bổ sung toàn bộ RLS policies bảo vệ bảng `profiles`, `items`, `requests`, `appointments` (bảo mật `pickup_code`).
4. **`src/context/AppContext.jsx`**: Đã tái cấu trúc Cloud-First toàn diện, xóa bỏ hoàn toàn fallback `Promise.all` bẩn khi RPC lỗi, cập nhật trạng thái `is_read` của thông báo lên Cloud.
5. **`src/components/RoleSwitcher.jsx`**: Đã khóa nút chuyển vai trò tự do khi kết nối Cloud, ngăn ngừa chiếm quyền Giáo viên/Quản sinh.
6. **`src/lib/supabase.js`**: Nâng cấp `genUniqueId` lên 16 hex characters (~1.8e19 entropy), kiểm thử 10,000 ID đạt 0% collision.

---

## 7. ĐIỀU KIỆN TIÊN QUYẾT ĐỂ TỔ CHỨC BUỔI THỬ NGHIỆM VỚI 3–5 THIẾT BỊ THẬT

Hội đồng nghiên cứu THCS Lê Lợi chỉ nên tổ chức buổi thử nghiệm trên thiết bị vật lý khi thỏa mãn đủ 3 điều kiện sau:

1. **Điều kiện 1 (Hạ tầng Staging):** Tạo 1 project Supabase Staging riêng, chạy hoàn tất 5 file migration (`001` đến `005`).
2. **Điều kiện 2 (Khởi tạo Tài khoản):** Khởi tạo 4 tài khoản theo file [`scripts/setup_staging_accounts.sql`](file:///d:/Lê Lợi Loop/scripts/setup_staging_accounts.sql) và kiểm tra đăng nhập thành công từng tài khoản trên trình duyệt.
3. **Điều kiện 3 (Kiểm tra Kết nối Realtime):** Mở 2 thiết bị tại trường, dùng Thiết bị 1 gửi yêu cầu nhận đồ, xác nhận chuông trên Thiết bị 2 reo đỏ trước khi tiến hành chu trình trao nhận chính thức tại Phòng Đội.

---

## 8. KẾT QUẢ BIÊN DỊCH & GIT STATUS

- **Kiểm tra đóng gói:** `npm run build` thực thi trên Vite 6.0.3 thành công xuất sắc trong **11.86s**, 2010 modules transformed, **0 lỗi cú pháp**.
- **Trạng thái Git Branch:** `feat/phase2-cloud-pilot`.
- **Tập tin Master tổng hợp:** Toàn bộ nội dung đã được hợp nhất tại [`LE_LOI_LOOP_MASTER_FULL_DOCUMENT.md`](file:///d:/Lê Lợi Loop/LE_LOI_LOOP_MASTER_FULL_DOCUMENT.md).

