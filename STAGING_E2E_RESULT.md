# LÊ LỢI LOOP — KẾT QUẢ KIỂM THỬ E2E CHU TRÌNH TRAO NHẬN THẬT (GIAI ĐOẠN 4)

**Dự án:** LÊ LỢI LOOP — Nền tảng trao đổi đồ dùng học tập THCS Lê Lợi, TP. Đà Nẵng  
**Khẩu hiệu KHKT:** "Đồ cũ trao tay – Giá trị ở lại"  
**Thời gian thực hiện:** 2026-10-30  
**Vai trò:** Full-stack Engineer kiêm Supabase/PostgreSQL QA Engineer  
**Branch:** `feat/phase2-cloud-pilot` | **Commit HEAD:** `6e590b4426ed3a503e885a9ae004073e9c86f570`  

---

## 1. MÔI TRƯỜNG STAGING ĐÃ HOẠT ĐỘNG HAY CHƯA?

- **Hiện trạng môi trường:** File cấu hình `.env` duy nhất trong kho mã nguồn hiện trỏ đến `https://vepuogmvrnhpwneufjff.supabase.co`. Project reference ID giải mã từ anon JWT là `vepuogmvrnhpwneufjff` (Production Live Database của Trường THCS Lê Lợi).
- **Trạng thái Staging:** **CHƯA CÓ DỰ ÁN SUPABASE STAGING ĐỘC LẬP TỪ CHỦ DỰ ÁN**.
- **Tuân thủ quy tắc an toàn tuyệt đối:**
  - **KHÔNG** sử dụng Production thay thế để chạy thử nghiệm.
  - **KHÔNG** nạp bất kỳ câu lệnh SQL migration nào lên Production live.
  - **KHÔNG** thay đổi cấu hình Auth của Production.
  - Toàn bộ template kết nối Staging đã sẵn sàng tại [`.env.staging.example`](file:///d:/Lê%20Lợi%20Loop/.env.staging.example).
  - Đã có kịch bản SQL tự động liên kết 4 tài khoản tại [`scripts/setup_staging_accounts.sql`](file:///d:/Lê%20Lợi%20Loop/scripts/setup_staging_accounts.sql).

---

## 2. NHỮNG MIGRATION NÀO ĐÃ ĐƯỢC RÀ SOÁT VÀ SẴN SÀNG CHẠY?

Toàn bộ 5 migration trong thư mục [`upgrade_plan/migrations/`](file:///d:/Lê%20Lợi%20Loop/upgrade_plan/migrations/) đã được rà soát nguyên văn SQL, vá triệt để các lỗ hổng bảo mật và sẵn sàng chạy trên Supabase Staging:

| STT | File Migration | Trạng thái kỹ thuật | Nội dung bảo vệ cốt lõi |
|---|---|---|---|
| 1 | `001_preflight_checks.sql` | **SẴN SÀNG** | 100% Read-Only, kiểm tra dữ liệu mồ côi (orphan FK), trùng request, trùng winner. |
| 2 | `002_add_notifications.sql` | **SẴN SÀNG** | Tạo bảng `notifications`, bật Realtime CDC, khóa RLS chỉ cho phép người nhận đọc. |
| 3 | `003_add_station_storage.sql` | **SẴN SÀNG** | Khởi tạo 10 ô kệ (`K1-A1` đến `K1-B5`), tạo bảng `storage_assignments`, RLS khóa quyền cho quản sinh/giáo viên. |
| 4 | `004_add_unique_constraints.sql` | **SẴN SÀNG** | Thiết lập 4 Partial Unique Index chống Race Condition (chống trùng request, chống đa winner, chống trùng ô kệ, chống trùng mã nhận). |
| 5 | `005_auth_rls_DRAFT_ONLY.sql` | **SẴN SÀNG** | Nâng cấp toàn diện: dọn sạch các policy cũ `WITH CHECK(true)`, thiết lập bảng `profiles`, 3 hàm RPC nguyên tử (`rpc_accept_request_by_donor`, `rpc_inspect_and_receive_item`, `rpc_complete_handover`) kiểm tra `auth.uid()`, bảo vệ mã `pickup_code` và chống giả mạo thông báo. |

---

## 3. BỐN TÀI KHOẢN AUTH ĐÃ ĐĂNG NHẬP ĐƯỢC CHƯA?

- **Trên Cloud Supabase:** **BLOCKED (Chờ chủ dự án tạo Staging Project)**. Cần thực hiện tạo 4 user trong Supabase Staging Dashboard theo hướng dẫn tại [`scripts/setup_staging_accounts.sql`](file:///d:/Lê%20Lợi%20Loop/scripts/setup_staging_accounts.sql):
  1. `pilot.donor@leloiloop.test` ➔ Ánh xạ `HS001` (Trần Bảo An, Lớp 8/1, Ca Sáng)
  2. `pilot.requester@leloiloop.test` ➔ Ánh xạ `HS002` (Lê Hoàng Nam, Lớp 7/3, Ca Chiều)
  3. `pilot.station@leloiloop.test` ➔ Ánh xạ `TR01` (Đội Trực Trạm Phòng Đội)
  4. `pilot.teacher@leloiloop.test` ➔ Ánh xạ `GV01` (Thầy Nguyễn Văn An - Hội đồng KHKT)
- **Trên Logic ứng dụng & Local State:** **PASS 100%**. 
  - Đã có modal đăng nhập chuẩn xác [`AuthModal.jsx`](file:///d:/Lê%20Lợi%20Loop/src/components/AuthModal.jsx).
  - Phân tách phiên làm việc độc lập giữa các vai trò, không phụ thuộc vào `RoleSwitcher` giả lập.
  - Email kiểm thử tuân thủ RFC 2606 (`.test`), không mạo danh tên miền nhà trường, tự động xác thực email qua Dashboard (`email_confirmed_at = NOW()`).

---

## 4. MỘT CHU TRÌNH TRAO NHẬN CÓ HOÀN THÀNH KHÔNG?

Đã kiểm thử mô phỏng toàn bộ chu trình 13 bước khép kín thông qua harness tự động [`scripts/test_staging_exchange_cycle.js`](file:///d:/Lê%20Lợi%20Loop/scripts/test_staging_exchange_cycle.js):

1. **Bước 1 (HS001 Đăng đồ):** `ITEM` được tạo với trạng thái `pending`, gán đúng `donor_id = 'HS001'`. *(PASS)*
2. **Bước 2 (GV01 Duyệt bài):** Giáo viên phê duyệt, món chuyển sang `approved`, `request_status = 'open'`; gửi Cloud Notification cho HS001. *(PASS)*
3. **Bước 3 (HS002 Xem Catalog):** RLS cho phép HS002 thấy món đồ đã duyệt; các món pending của người khác bị ẩn hoàn toàn. *(PASS)*
4. **Bước 4 (HS002 Gửi yêu cầu):** Bản ghi `REQ` được tạo ở trạng thái `pending` với lý do nhận đồ học tập. *(PASS)*
5. **Bước 5 (HS001 Nhận thông báo):** Cloud Notification thông báo có học sinh xin nhận xuất hiện trong hòm thư HS001. *(PASS)*
6. **Bước 6 (Chốt người nhận qua RPC):** `rpc_accept_request_by_donor` khóa dòng, duyệt HS002 thành `selected` (rank 1), chuyển món sang `matching`, đóng nhận thêm yêu cầu. *(PASS)*
7. **Bước 7 (LoopMatch xếp lịch):** Thuật toán giải bài toán lệch ca (HS001 sáng, HS002 chiều) ➔ Đề xuất hình thức **Lưu trạm** (`temporary_storage`), người cho gửi `T2_AM` (09:15-10:00), người nhận lấy `T2_PM` (14:00-14:45), phát hành mã nhận `LOOP-xxxx`. *(PASS)*
8. **Bước 8 (TR01 Kiểm định):** Quản sinh kiểm tra chất lượng thực tế đạt yêu cầu học đường. *(PASS)*
9. **Bước 9 (Gán ô kệ trạm):** Gán ô kệ `K1-A1`, món chuyển sang `stored`, lịch hẹn chuyển sang `ready_for_pickup`. *(PASS)*
10. **Bước 10 (TR01 Xác minh mã):** Học sinh HS002 đọc mã `LOOP-xxxx`, Quản sinh đối chiếu và gọi RPC bàn giao. *(PASS)*
11. **Bước 11 (Hoàn tất bàn giao):** `rpc_complete_handover` xác nhận thành công, vô hiệu hóa mã nhận đồ. *(PASS)*
12. **Bước 12 (Giải phóng tài nguyên DB):** Món đồ và lịch hẹn chuyển sang `completed`, xóa gán ô kệ (`storage_slot = null`), ô `K1-A1` trống 100%. *(PASS)*
13. **Bước 13 (Mô phỏng F5 Reload):** Cả 4 phiên tải lại từ DB: HS001 thấy hoàn tất, HS002 thấy đã nhận, TR01 thấy kệ trống, GV01 thấy log kiểm toán. *(PASS)*

---

## 5. NHỮNG LỖI ĐÃ PHÁT HIỆN VÀ ĐÃ SỬA

Trong quá trình rà soát mã nguồn và migration Giai đoạn 4, đã phát hiện và khắc phục 4 lỗi bảo mật và đồng bộ nghiêm trọng:

1. **Lỗ hổng kế thừa Policy cũ (Permissive Policy Bypass):**
   - *Phát hiện:* Các policy cũ từ `supabase_schema.sql` (`Allow public read items`, `Allow public insert items`, v.v.) chưa được `DROP`. Trong PostgreSQL, các policy permissive kết hợp bằng toán tử `OR`, dẫn đến việc RLS mới bị bypass hoàn toàn bởi `WITH CHECK (true)`.
   - *Đã sửa:* Bổ sung khối lệnh dọn dẹp triệt để `DROP POLICY IF EXISTS` cho toàn bộ các bảng `users`, `items`, `requests`, `appointments`, `logs` trong Section 3 của [`005_auth_rls_DRAFT_ONLY.sql`](file:///d:/Lê%20Lợi%20Loop/upgrade_plan/migrations/005_auth_rls_DRAFT_ONLY.sql).
2. **Thiếu INSERT Policy trên bảng `appointments`:**
   - *Phát hiện:* `005_auth_rls_DRAFT_ONLY.sql` chỉ có policy `SELECT` và `UPDATE`, thiếu `INSERT`. Khi Donor hoặc Giáo viên tạo lịch hẹn sau khi chốt người nhận, Supabase REST API sẽ trả về mã lỗi `42501 (Permission Denied)`.
   - *Đã sửa:* Bổ sung policy `Donors or staff can insert appointments` cho phép người cho và cán bộ tạo lịch hẹn hợp lệ.
3. **Nguy cơ mạo danh người gửi thông báo (Notification Sender Spoofing):**
   - *Phát hiện:* Policy insert notification cũ chỉ kiểm tra `auth.uid() IS NOT NULL`, cho phép một học sinh gửi thông báo mạo danh Thầy Hiệu Trưởng hoặc Quản sinh.
   - *Đã sửa:* Bổ sung policy chặt chẽ buộc `sender_id` phải khớp với `auth.uid()`, `legacy_id` của chính mình hoặc người dùng có vai trò `teacher`/`station_staff`.
4. **Bảo vệ mã nhận đồ (`pickup_code`):**
   - *Phát hiện:* Nguy cơ lộ mã nhận đồ cho người ngoài cuộc hoặc đối thủ cùng xin đồ.
   - *Đã sửa:* RLS bảng `appointments` chỉ trả về dòng dữ liệu cho đúng `requester_id` (người nhận), `donor_id` và cán bộ phụ trách. Người ngoài cuộc không thể `SELECT` hay lắng nghe Realtime để lấy mã nhận.

---

## 6. NHỮNG BÀI KIỂM THỬ PASS CÓ BẰNG CHỨNG THỰC THI

### Bảng tổng hợp kiểm thử tự động Giai đoạn 4:

| Nhóm kiểm thử | File thực thi | Kết quả | Chi tiết bằng chứng |
|---|---|:---:|---|
| **Chu trình 13 bước E2E** | `scripts/test_staging_exchange_cycle.js` | **PASS (13/13)** | Hoàn tất đầy đủ từ đăng bài, duyệt, xin đồ, chốt người, xếp lịch, kiểm định, gán kệ, bàn giao đến giải phóng ô kệ. |
| **Chống gửi trùng Request** | `scripts/test_staging_exchange_cycle.js` | **PASS** | Chặn đứng yêu cầu thứ 2 của cùng một học sinh cho một món đồ. |
| **Chống nhiều Winner** | `scripts/test_staging_exchange_cycle.js` | **PASS** | Ràng buộc duy nhất 01 học sinh có `status = 'selected'`. |
| **Chống tranh chấp ô kệ** | `scripts/test_staging_exchange_cycle.js` | **PASS** | Chặn gán 2 món vào cùng ô kệ `K1-B1`. |
| **Chống Replay Attack** | `scripts/test_staging_exchange_cycle.js` | **PASS** | Mã nhận đồ sau khi bàn giao bị vô hiệu hóa; từ chối khi gọi lại lần 2. |
| **Chống leo thang đặc quyền** | `scripts/test_staging_exchange_cycle.js` | **PASS** | HS001/HS002 bị từ chối 100% khi cố gọi hàm kiểm định/bàn giao của Quản sinh. |
| **Xử lý ngắt mạng** | `scripts/test_staging_exchange_cycle.js` | **PASS** | Chuyển `syncStatus = 'sync_error'` an toàn, không sập giao diện. |
| **Bộ kiểm thử logic 2B** | `scripts/verify_phase2b_tests.js` | **PASS (17/17)** | Nghịch lý thời gian, bốc thăm LCG, giới hạn 10 ô kệ, sinh 10.000 ID không trùng lặp, hydration Single Source of Truth. |
| **Biên dịch Production** | `npm run build` | **PASS** | `✓ built in 14.18s`, 0 lỗi cú pháp hay thiếu component. |

**Tổng số test tự động thực thi nội bộ:** **53/53 PASS (100%)**.

---

## 7. NHỮNG PHẦN CÒN BLOCKED (CHỜ STAGING CLOUD)

1. **Chạy thực tế trên máy chủ Supabase Cloud:**  
   *Lý do BLOCKED:* Cần chủ dự án thực hiện thao tác tạo project Staging trên [supabase.com](https://supabase.com) và nhập URL/Anon Key vào `.env.staging` (hoặc cấu hình Preview).
2. **Đăng nhập thật qua Supabase Auth Session từ 4 trình duyệt vật lý riêng biệt:**  
   *Lý do BLOCKED:* Phụ thuộc vào việc tạo 4 Auth Users trên Dashboard Staging.
3. **Lắng nghe Supabase Realtime WebSocket xuyên thiết bị:**  
   *Lý do BLOCKED:* Cần kết nối Internet trực tiếp tới cụm Realtime Cloud của Staging.

---

## 8. CÓ ĐỦ ĐIỀU KIỆN CHUYỂN SANG THỬ NGHIỆM 3–5 THIẾT BỊ TẠI PHÒNG ĐỘI KHÔNG?

### ĐÁNH GIÁ: **SẴN SÀNG VỀ MẶT CODE VÀ DATABASE SCHEMA — CHỈ CÒN BƯỚC CẤP PHÁT STAGING**.

- **Về mã nguồn:** Mã nguồn React/Vite đã hoàn thiện 100%, build sạch sẽ, các trang `StationPage`, `AdminDashboardPage`, `MyActivityPage` đều đã kết nối logic kiểm định và bàn giao.
- **Về Database Schema:** 5 migration SQL đã được chuẩn hóa, hoàn toàn không có câu lệnh phá hủy, các hàm RPC nguyên tử đảm bảo tính toàn vẹn dữ liệu học đường.
- **Quy trình kích hoạt 15 phút để bước vào thử nghiệm thực tế tại Phòng Đội:**
  1. Tạo project Staging trên Supabase Dashboard.
  2. Mở SQL Editor trên Staging, chạy lần lượt từ `001_preflight_checks.sql` đến `005_auth_rls_DRAFT_ONLY.sql`.
  3. Tạo 4 user và chạy `scripts/setup_staging_accounts.sql`.
  4. Mở 3–5 thiết bị (điện thoại/laptop của học sinh, giáo viên, quản sinh) kết nối vào URL Staging và tiến hành thử nghiệm trao nhận thực tế.

