# TÀI LIỆU VÀ BÁO CÁO TOÀN DIỆN DUY NHẤT HỆ THỐNG LÊ LỢI LOOP
**Dự án:** LÊ LỢI LOOP - Nền tảng Tuần hoàn Đồ dùng Học tập Thông minh (THCS Lê Lợi, TP. Đà Nẵng)  
**Chủ đề:** Nghiên cứu Khoa học Kỹ thuật (KHKT) cấp Thành phố 2024–2025  
**Khẩu hiệu:** *"Đồ cũ trao tay – Giá trị ở lại"*  
**Phiên bản:** Bản Master Tổng Hợp Toàn Bộ Báo Cáo & Câu Trả Lời (Single Source Document)  
**Branch kỹ thuật:** `fix/cloud-multi-user-pilot`  
**Ngày cập nhật:** 30/10/2026  

---

## MỤC LỤC TỔNG THỂ

1. [CHƯƠNG 1: TỔNG QUAN DỰ ÁN & BỐI CẢNH NGHIÊN CỨU](#chương-1-tổng-quan-dự-án--bối-cảnh-nghiên-cứu)
2. [CHƯƠNG 2: KIẾN TRÚC KỸ THUẬT & CÔNG NGHỆ HIỆN HÀNH](#chương-2-kiến-trúc-kỹ-thuật--công-nghệ-hiện-hành)
3. [CHƯƠNG 3: BÁO CÁO KIỂM TOÁN CHỨC NĂNG & MÃ NGUỒN (QA AUDIT)](#chương-3-báo-cáo-kiểm-toán-chức-năng--mã-nguồn-qa-audit)
4. [CHƯƠNG 4: ĐÁNH GIÁ CHUYÊN SÂU ĐỒNG BỘ ĐA NGƯỜI DÙNG & DUAL-STORAGE](#chương-4-đánh-giá-chuyên-sâu-đồng-bộ-đa-người-dùng--dual-storage)
5. [CHƯƠNG 5: KẾT QUẢ KIỂM KÊ DATABASE & PROBE SUPABASE LIVE THỰC TẾ](#chương-5-kết-quả-kiểm-kê-database--probe-supabase-live-thực-tế)
6. [CHƯƠNG 6: QUY TẮC NGHIỆP VỤ & THUẬT TOÁN ĐIỀU PHỐI (LOOPMATCH & LCG)](#chương-6-quy-tắc-nghiệp-vụ--thuật-toán-điều-phối-loopmatch--lcg)
7. [CHƯƠNG 7: KẾ HOẠCH NÂNG CẤP DATABASE & BỘ MIGRATION SQL ADDITIVE ĐẦY ĐỦ](#chương-7-kế-hoạch-nâng-cấp-database--bộ-migration-sql-additive-đầy-đủ)
8. [CHƯƠNG 8: THIẾT KẾ XÁC THỰC (AUTH) & ROW LEVEL SECURITY (RLS)](#chương-8-thiết-kế-xác-thực-auth--row-level-security-rls)
9. [CHƯƠNG 9: THIẾT KẾ GIAO DỊCH NGUYÊN TỬ (SECURE RPC TRANSACTIONS)](#chương-9-thiết-kế-giao-dịch-nguyên-tử-secure-rpc-transactions)
10. [CHƯƠNG 10: KỊCH BẢN KIỂM THỬ ĐA THIẾT BỊ ĐỘC LẬP (3–5 THIẾT BỊ)](#chương-10-kịch-bản-kiểm-thử-đa-thiết-bị-độc-lập-35-thiết-bị)
11. [CHƯƠNG 11: KẾ HOẠCH PHÁT HÀNH, VẬN HÀNH & ROLLBACK AN TOÀN](#chương-11-kế-hoạch-phát-hành-vận-hành--rollback-an-toàn)
12. [CHƯƠNG 12: BẢNG MA TRẬN QUYẾT ĐỊNH & 4 CÂU HỎI PHÊ DUYỆT GIAI ĐOẠN 2](#chương-12-bảng-ma-trận-quyết-định--4-câu-hỏi-phê-duyệt-giai-đoạn-2)
13. [CHƯƠNG 13: TRIỂN KHAI GIAI ĐOẠN 2 — KIẾN TRÚC THÍ ĐIỂM CLOUD HOẠT ĐỘNG THẬT](#chương-13-triển-khai-giai-đoạn-2--kiến-trúc-thí-điểm-cloud-hoạt-động-thật)
14. [CHƯƠNG 14: CHI TIẾT CẢI TIẾN MÃ NGUỒN FRONTEND & AUTH (STAGE 2 IMPLEMENTATION)](#chương-14-chi-tiết-cải-tiến-mã-nguồn-frontend--auth-stage-2-implementation)
15. [CHƯƠNG 15: MA TRẬN ĐÁNH GIÁ VÀ XÁC MINH 16 BÀI TEST NGHIỆM THU (T01–T16)](#chương-15-ma-trận-đánh-giá-và-xác-minh-16-bài-test-nghiệm-thu-t01t16)
16. [CHƯƠNG 16: HƯỚNG DẪN VẬN HÀNH PILOT THỰC TẾ 3–5 THIẾT BỊ TẠI PHÒNG ĐỘI THCS LÊ LỢI](#chương-16-hướng-dẫn-vận-hành-pilot-thực-tế-35-thiết-bị-tại-phòng-đội-thcs-lê-lợi)
17. [CHƯƠNG 17: QUY TRÌNH DEPLOY VÀ PHÁT HÀNH AN TOÀN TRÊN VERCEL](#chương-17-quy-trình-deploy-và-phát-hành-an-toàn-trên-vercel)
18. [CHƯƠNG 18: GIAI ĐOẠN 2B — XÁC MINH TRIỂN KHAI VÀ KHẮC PHỤC THỰC TẾ](#chương-18-giai-đoạn-2b--xác-minh-triển-khai-và-khắc-phục-thực-tế)
19. [CHƯƠNG 19: GIAI ĐOẠN 3 — CHUẨN BỊ STAGING VÀ XÁC MINH DATABASE THỰC](#chương-19-giai-đoạn-3--chuẩn-bị-staging-và-xác-minh-database-thực)

---

## CHƯƠNG 1: TỔNG QUAN DỰ ÁN & BỐI CẢNH NGHIÊN CỨU

### 1.1. Mục tiêu và ý nghĩa xã hội
Dự án **LÊ LỢI LOOP** giải quyết vấn đề lãng phí đồ dùng học tập (sách giáo khoa, truyện tranh, cặp sách, compa, thước kẻ kỹ thuật, đồng phục) sau mỗi học kỳ tại trường THCS Lê Lợi, TP. Đà Nẵng. Hệ thống số hóa quy trình tuần hoàn đồ dùng, kết hợp trạm trung chuyển thực tế đặt tại **Phòng Đội - Phân hiệu Trường THCS Lê Lợi**.

### 1.2. Các vai trò trong hệ thống
1. **Học sinh (Student - `HS`):** Người cho đồ (`Donor`) hoặc người xin nhận đồ (`Requester`), đăng tải bài đăng, chọn khung giờ rảnh trong tuần và theo dõi tiến độ trao nhận.
2. **Quản sinh Trạm Phòng Đội (Station Staff - `TR`):** CLB Tình nguyện phụ trách nhận đồ, kiểm tra chất lượng thực tế (Đạt/Không đạt), cất đồ vào 10 ô kệ lưu trữ (`K1-A1` đến `K1-B5`) và xác minh mã bàn giao.
3. **Giáo viên Phụ trách / Ban Quản trị (Teacher / Admin - `GV`):** Thầy Tổng phụ trách Đội hoặc giáo viên hướng dẫn KHKT, phê duyệt bài đăng công khai, kích hoạt bốc thăm công bằng LCG và giám sát nhật ký kiểm toán.

---

## CHƯƠNG 2: KIẾN TRÚC KỸ THUẬT & CÔNG NGHỆ HIỆN HÀNH

- **Frontend:** React 18.3.1 (SPA), Vite 6.0.3, Tailwind CSS 3.4.16, Lucide React 1.16.0.
- **Backend / Database:** Supabase Cloud (PostgreSQL 15+), `@supabase/supabase-js 2.118.0`.
- **Cơ chế lưu trữ:** Mô hình lai (Hybrid Dual-Storage) kết hợp React State, bộ nhớ đệm `localStorage` của trình duyệt và Supabase REST/Realtime.
- **Hosting:** Vercel (Cấu hình SPA Rewrites qua `vercel.json`).

---

## CHƯƠNG 3: BÁO CÁO KIỂM TOÁN CHỨC NĂNG & MÃ NGUỒN (QA AUDIT)

Qua kiểm tra đối chiếu 31 tiêu chí chức năng từ mã nguồn thực tế:
- **PASS: 18 tiêu chí (58.1%)** – Nghiệp vụ lõi (LoopMatch, bốc thăm LCG, catalog, vòng đời đồ dùng, sơ đồ trạm 10 ô kệ) hoạt động chính xác.
- **PARTIAL: 7 tiêu chí (22.6%)** – Đã có logic nhưng còn phụ thuộc vào LocalStorage hoặc dùng mô phỏng cho KHKT.
- **FAIL: 2 tiêu chí (6.4%)** – Thiếu bảng `notifications` trên Database Cloud và RLS đang mở toàn quyền cho `anon`.
- **NOT IMPLEMENTED: 4 tiêu chí (12.9%)** – Chưa có giao diện đổi lịch trên Admin, chưa có tính năng học sinh tự hủy/sửa bài đăng, chưa tích hợp Supabase Auth thật.

---

## CHƯƠNG 4: ĐÁNH GIÁ CHUYÊN SÂU ĐỒNG BỘ ĐA NGƯỜI DÙNG & DUAL-STORAGE

### 4.1. Chu trình nạp dữ liệu (Data Loading Pipeline)
1. **Pha 1 (Đồng bộ tức thì):** Khi mở ứng dụng hoặc F5, React đọc ngay từ `localStorage` (`LE_LOI_LOOP_V1_ITEMS`, `REQUESTS`, `APPOINTMENTS`, `NOTIFICATIONS`). Nếu rỗng, nạp `seedData.js`.
2. **Pha 2 (Bất đồng bộ sau render):** `loadDataFromSupabase()` truy vấn song song các bảng Cloud.
   - *Nếu Cloud có dữ liệu:* Cập nhật React state và lưu đè lại vào `localStorage`.
   - *Nếu Cloud trả về mảng rỗng `[]`:* Mã nguồn trên branch `fix/cloud-multi-user-pilot` đã cập nhật state về `[]` chuẩn xác.
   - *Nếu Cloud lỗi:* Bật cờ `syncStatus = 'sync_error'`, giữ nguyên dữ liệu local và hiển thị banner cảnh báo.

### 4.2. Rào cản đa thiết bị hiện tại
- **Chưa có phiên làm việc độc lập:** Hai trình duyệt mở 2 máy khác nhau đều dùng chung Anon Key, danh tính chỉ là biến cục bộ `currentUser` trong LocalStorage.
- **Chuông thông báo 100% cục bộ:** Khi Máy B gửi request, thông báo chỉ lưu vào LocalStorage của Máy B. Máy A hoàn toàn không nhận được tín hiệu chuông qua Cloud.
- **Xung đột ID phân tán:** Mã nguồn ban đầu đếm `items.length + 1` (`M013`). Trên branch `fix/cloud-multi-user-pilot`, đã được khắc phục bằng hàm `genUniqueId` chống trùng khóa chính.

---

## CHƯƠNG 5: KẾT QUẢ KIỂM KÊ DATABASE & PROBE SUPABASE LIVE THỰC TẾ

*Kết quả kiểm tra trực tiếp qua REST API tại `https://vepuogmvrnhpwneufjff.supabase.co`:*

| Bảng dữ liệu | Trạng thái Live | Số dòng hiện có | Primary Key | Khóa ngoại (FK) | Ghi chú kỹ thuật |
| :--- | :---: | :---: | :--- | :--- | :--- |
| **`public.users`** | **TỒN TẠI** | **4 dòng** | `id (TEXT)` | Không | Đầy đủ 4 tài khoản mẫu (`HS001`, `HS002`, `TR01`, `GV01`). |
| **`public.items`** | **TỒN TẠI** | **12 dòng** | `id (TEXT)` | `donor_id -> users(id)` | 12 món đồ mẫu (`M001` đến `M012`). |
| **`public.requests`** | **TỒN TẠI** | **5 dòng** | `id (TEXT)` | `item_id`, `requester_id` | 5 yêu cầu mẫu (`REQ-001` đến `REQ-005`). |
| **`public.appointments`**| **TỒN TẠI** | **3 dòng** | `id (TEXT)` | `item_id`, `request_id`, `donor_id`, `requester_id` | 3 lịch hẹn mẫu (`APT-101`, `APT-102`, `APT-103`). |
| **`public.logs`** | **TỒN TẠI** | **5 dòng** | `id (TEXT)` | Không | 5 nhật ký kiểm toán hệ thống. |
| **`public.notifications`**| ❌ **CHƯA CÓ** | **0 dòng** | Chưa có | Chưa có | **HTTP 404 (PGRST205)**: Chưa được tạo trên Supabase. |
| **`public.station_slots`**| ❌ **CHƯA CÓ** | Chưa có | Chưa có | Chưa có | Đang hardcode 10 ô kệ trong frontend. |
| **`public.storage_assignments`**| ❌ **CHƯA CÓ**| Chưa có | Chưa có | Chưa có | Đang lưu trực tiếp cột `storage_slot`. |

- **Cấu hình Auth Live:** `email: true`, `disable_signup: false`, nhưng **`mailer_autoconfirm: false` (Tự động xác nhận email đang TẮT)**. Học sinh không có email thật sẽ bị chặn ở bước xác thực email nếu không tắt tùy chọn này trong Dashboard.
- **Preflight Data Quality Live:** Đã quét sạch sẽ: 0 request trùng, 0 ô kệ trùng, 0 mã nhận đồ trùng.

---

## CHƯƠNG 6: QUY TẮC NGHIỆP VỤ & THUẬT TOÁN ĐIỀU PHỐI (LOOPMATCH & LCG)

### 6.1. Vòng đời món đồ học tập (`items`)
- `pending`: Mới đăng, chờ duyệt.
- `approved`: Đã duyệt, hiển thị công khai trên Kho đồ để học sinh xin nhận.
- `matching`: Đã chốt người nhận (qua bốc thăm hoặc người cho duyệt), chuyển sang xếp lịch LoopMatch.
- `stored`: Người cho đã mang đồ đến trạm, đạt kiểm định thực tế, cất vào 1 trong 10 ô kệ.
- `ready_for_pickup`: Sẵn sàng cho người nhận đến lấy đồ tại trạm.
- `completed`: Hoàn tất chu trình tuần hoàn, giải phóng ô kệ và vô hiệu hóa mã nhận đồ.
- `rejected`: Không đạt quy định học đường hoặc không đạt kiểm tra thực tế tại trạm.

### 6.2. Thuật toán LoopMatch
- Tìm khung giờ giao nhau giữa Lịch rảnh Người Cho ($T_A$), Lịch rảnh Người Nhận ($T_B$) và Khung giờ mở cửa Trạm Phòng Đội (10 ca/tuần).
- **Ràng buộc nghịch lý thời gian ($t_{cho} \le t_{nhan}$):** Người cho phải gửi trước hoặc cùng ca người nhận đến lấy. Nếu vi phạm, trả về lỗi `TIME_PARADOX`.
- **Ràng buộc lưu trạm:** Lưu kho không quá 3 ngày; sức chứa trạm không vượt quá 10 món.

### 6.3. Thuật toán Bốc thăm ngẫu nhiên công bằng (LCG)
- Sử dụng thuật toán Linear Congruential Generator với seed kiểm toán cố định (`LE-LOI-LOOP-KHKT-2026`).
- Chọn ra đúng 01 người nhận chính thức (`selected`) và các bạn còn lại làm dự phòng (`backup`), đảm bảo tính minh bạch và có thể tái lập trước ban giám khảo.

### 6.4. Bảo mật mã nhận đồ 4 số (`pickup_code`)
- Phát hành mã định danh bí mật (ví dụ: `LOOP-7821`).
- Chỉ hiển thị cho Người Nhận và Quản sinh trạm; Người Cho không xem được mã.
- Sau khi bàn giao thành công, mã lập tức bị vô hiệu hóa, không thể sử dụng lại lần thứ hai.

---

## CHƯƠNG 7: KẾ HOẠCH NÂNG CẤP DATABASE & BỘ MIGRATION SQL ADDITIVE ĐẦY ĐỦ

### File 1: `001_preflight_checks.sql` (Chỉ SELECT kiểm tra dữ liệu mồ côi và trùng lặp)
```sql
SELECT item_id, requester_id, COUNT(*) 
FROM public.requests 
WHERE status != 'rejected' 
GROUP BY item_id, requester_id HAVING COUNT(*) > 1;

SELECT storage_slot, COUNT(*) 
FROM public.items 
WHERE status = 'stored' AND storage_slot IS NOT NULL 
GROUP BY storage_slot HAVING COUNT(*) > 1;
```

### File 2: `002_add_notifications.sql` (Tạo bảng chuông thông báo Cloud)
```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread 
ON public.notifications(recipient_id, is_read, created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
```

### File 3: `003_add_station_storage.sql` (Quản lý 10 ô kệ trạm K1-A1 đến K1-B5)
```sql
CREATE TABLE IF NOT EXISTS public.station_slots (
    id TEXT PRIMARY KEY,
    shelf_zone TEXT NOT NULL,
    slot_number INTEGER NOT NULL,
    max_dimensions TEXT DEFAULT '30x40x25 cm',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.station_slots (id, shelf_zone, slot_number, max_dimensions) VALUES
('K1-A1', 'Khu A', 1, '30x40x25 cm'), ('K1-A2', 'Khu A', 2, '30x40x25 cm'),
('K1-A3', 'Khu A', 3, '30x40x25 cm'), ('K1-A4', 'Khu A', 4, '30x40x25 cm'),
('K1-A5', 'Khu A', 5, '30x40x25 cm'), ('K1-B1', 'Khu B', 1, '35x45x30 cm'),
('K1-B2', 'Khu B', 2, '35x45x30 cm'), ('K1-B3', 'Khu B', 3, '35x45x30 cm'),
('K1-B4', 'Khu B', 4, '35x45x30 cm'), ('K1-B5', 'Khu B', 5, '35x45x30 cm')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.storage_assignments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    slot_id TEXT NOT NULL REFERENCES public.station_slots(id) ON DELETE RESTRICT,
    item_id TEXT NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    appointment_id TEXT REFERENCES public.appointments(id) ON DELETE SET NULL,
    assigned_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'occupied',
    occupied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    released_at TIMESTAMPTZ,
    notes TEXT
);
```

### File 4: `004_add_unique_constraints.sql` (Chỉ mục Unique chống Race Condition)
```sql
CREATE UNIQUE INDEX IF NOT EXISTS uq_requests_active_item_requester 
ON public.requests(item_id, requester_id) WHERE status != 'rejected';

CREATE UNIQUE INDEX IF NOT EXISTS uq_requests_single_winner 
ON public.requests(item_id) WHERE status = 'selected';

CREATE UNIQUE INDEX IF NOT EXISTS uq_items_single_occupied_slot 
ON public.items(storage_slot) WHERE status = 'stored' AND storage_slot IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_active_code 
ON public.appointments(pickup_code) WHERE status IN ('scheduled', 'ready_for_pickup');
```

### File 5: `005_auth_rls_DRAFT_ONLY.sql` (Bản nháp Auth, Profiles và Secure RPC)
*(Được lưu riêng để review, không chạy trên live trong giai đoạn 1)*.

---

## CHƯƠNG 8: THIẾT KẾ XÁC THỰC (AUTH) & ROW LEVEL SECURITY (RLS)

- **Mô hình ánh xạ:** `auth.users(id UUID)` -> `public.profiles(auth_user_id UUID, legacy_user_id TEXT, role, class, shift)`.
- **Giải pháp định danh không phụ thuộc email trường:** Sử dụng email ảo định dạng `hs001@leloiloop.local`, `gv01@leloiloop.local` kèm tắt xác thực email trên Supabase Dashboard.
- **Nguyên tắc RLS:**
  - `items`: Học sinh chỉ sửa bài của mình khi đang `pending`.
  - `requests`: Học sinh chỉ xem request của chính mình.
  - `notifications`: Chỉ duy nhất người nhận (`recipient_id = auth.uid()`) mới có quyền đọc và cập nhật trạng thái đã đọc.
  - `appointments`: Mã nhận đồ chỉ hiển thị cho Người Nhận và Quản sinh trạm.

---

## CHƯƠNG 9: THIẾT KẾ GIAO DỊCH NGUYÊN TỬ (SECURE RPC TRANSACTIONS)

1. **`rpc_accept_request_by_donor(p_request_id TEXT)`:**
   - Lấy `v_auth_id := auth.uid()::text`.
   - Kiểm tra `v_auth_id == item.donor_id` hoặc người gọi là `teacher`.
   - Cập nhật request thành `selected`, các request khác thành `backup`, món đồ thành `matching`, tự động tạo thông báo Cloud cho người nhận.
2. **`rpc_inspect_and_receive_item(p_apt_id TEXT, p_passed BOOLEAN, p_note TEXT, p_storage_slot TEXT)`:**
   - Xác minh người gọi có vai trò `station_staff`, `teacher` hoặc `admin`.
   - Khóa dòng bảng `items` với `FOR UPDATE`.
   - Kiểm tra ô kệ có bị chiếm không; nếu ô đã có đồ thì dừng giao dịch và báo lỗi ngay.
   - Cập nhật lịch hẹn `ready_for_pickup` và cất đồ vào ô kệ `stored`.
3. **`rpc_complete_handover(p_pickup_code TEXT)`:**
   - Xác minh quyền cán bộ trực trạm.
   - Khóa dòng lịch hẹn với `FOR UPDATE`.
   - Kiểm tra mã nhận đồ đã bị `completed` trước đó chưa.
   - Hoàn tất giao dịch, giải phóng ô kệ và vô hiệu hóa mã nhận.

---

## CHƯƠNG 10: KỊCH BẢN KIỂM THỬ ĐA THIẾT BỊ ĐỘC LẬP (3–5 THIẾT BỊ)

### Phân bổ thiết bị:
- **Thiết bị 1 (Laptop Giáo viên / Admin):** `GV01`.
- **Thiết bị 2 (Điện thoại Học sinh Cho):** `HS001` (iPhone).
- **Thiết bị 3 (Điện thoại Học sinh Nhận A):** `HS002` (Android).
- **Thiết bị 4 (Điện thoại Học sinh Nhận B):** `HS003` (Android).
- **Thiết bị 5 (Máy tính bảng / Laptop Trạm Phòng Đội):** `TR01` (iPad).

### 10 Kịch bản kiểm thử:
1. `MDT-01`: Đăng đồ trên TB2 -> TB1 duyệt bài -> TB3 thấy trên Kho đồ ngay lập tức ($\le 1s$).
2. `MDT-02`: TB3 và TB4 cùng gửi yêu cầu xin nhận 1 món đồ của TB2 -> TB2 thấy đủ 2 ứng viên.
3. `MDT-03`: TB3 gửi yêu cầu -> Chuông thông báo trên TB2 reo đỏ kèm popup trong $\le 0.5s$.
4. `MDT-04`: TB3 mở 2 tab cố tình gửi trùng -> Database kích hoạt unique constraint từ chối yêu cầu thứ 2.
5. `MDT-05`: TB2 bấm đồng ý trao đồ cho TB3 -> TB3 nhận thông báo chúc mừng; TB4 tự động chuyển trạng thái dự phòng (`backup`).
6. `MDT-06`: TB5 và TB1 cùng bấm gán ô kệ `K1-A1` trong cùng 1 giây -> Người bấm trước gán thành công; người bấm sau nhận thông báo ô kệ đã có đồ.
7. `MDT-07`: Bàn giao đồ bằng mã 4 số `LOOP-xxxx` -> Giải phóng kệ thành công; nếu nhập lại lần 2 hệ thống từ chối an toàn.
8. `MDT-08`: Nhấn F5 trên toàn bộ thiết bị -> Dữ liệu hiển thị đúng 100% theo trạng thái mới nhất trên Supabase Cloud.
9. `MDT-09`: Tắt mạng WiFi trên TB2 -> Hệ thống hiện banner cảnh báo mất kết nối Cloud, không báo thành công giả tạo.
10. `MDT-10`: Học sinh gõ trực tiếp URL `/admin` -> `ProtectedRoute` chặn lại ngay lập tức và đưa về trang chủ.

---

## CHƯƠNG 11: KẾ HOẠCH PHÁT HÀNH, VẬN HÀNH & ROLLBACK AN TOÀN

### Kịch bản Rollback khẩn cấp trong 30 giây:
```sql
DROP INDEX IF EXISTS public.uq_requests_active_item_requester;
DROP INDEX IF EXISTS public.uq_requests_single_winner;
DROP INDEX IF EXISTS public.uq_items_single_occupied_slot;
DROP INDEX IF EXISTS public.uq_appointments_active_code;

ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.notifications;
DROP TABLE IF EXISTS public.storage_assignments;
DROP TABLE IF EXISTS public.station_slots;
DROP TABLE IF EXISTS public.notifications;
```
Trên máy lập trình:
```powershell
git checkout main
```

---

## CHƯƠNG 12: BẢNG MA TRẬN QUYẾT ĐỊNH & 4 CÂU HỎI PHÊ DUYỆT GIAI ĐOẠN 2

| DECISION | CURRENT | TARGET | BLOCKER | MIGRATION | FRONTEND IMPACT | RISK |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **D1: Tạo bảng Notifications** | Chưa có trên Cloud (404), chỉ lưu LocalStorage | Bảng `public.notifications` đồng bộ Realtime qua Cloud | Không có (Preflight sạch) | `002_add_notifications.sql` | Chuông Navbar reo tức thì liên máy tính | **THẤP (P2)** |
| **D2: Chống gửi trùng Request** | Chặn trên nút bấm UI, DB không có ràng buộc | Partial Unique Index trên `requests(item_id, requester_id)` | Phải đảm bảo không có request trùng cũ | `004_add_unique_constraints.sql` | Ngăn chặn học sinh mở 2 tab spam yêu cầu | **TRUNG BÌNH (P1)** |
| **D3: Chống Race Condition ô kệ** | Quản sinh tự nhìn dropdown, dễ chọn đè ô đã có đồ | Partial Unique Index trên `items(storage_slot)` + Bảng `storage_assignments` | Phải đảm bảo các món đồ cũ không bị trùng ô | `003_add_station_storage.sql` & `004_add_unique_constraints.sql` | Dropdown tự disable ô đã có đồ; DB từ chối nếu 2 máy cùng chọn | **TRUNG BÌNH (P1)** |
| **D4: Bảo vệ Giao dịch đa bảng (ACID)** | `Promise.all` riêng lẻ từ frontend | 3 hàm Stored Procedure (RPC) nguyên tử, xác minh quyền qua `auth.uid()` | Cần phiên đăng nhập Auth hoặc quyền role hợp lệ | `005_auth_rls_DRAFT_ONLY.sql` | Gọi `supabase.rpc(...)`, loại bỏ nguy cơ dữ liệu dở dang | **TRUNG BÌNH (P1)** |
| **D5: Chuyển đổi sang Supabase Auth** | `RoleSwitcher.jsx` đổi biến `currentUser` cục bộ | Đăng nhập bằng tài khoản ảo `hs001@leloiloop.local` + `profiles` table | `mailer_autoconfirm` đang Tắt trên Supabase | `005_auth_rls_DRAFT_ONLY.sql` | Cần cập nhật giao diện đăng nhập ở Giai đoạn 2 | **CAO (P0)** |
| **D6: Xóa bỏ LocalStorage-First** | Mở app đọc LocalStorage trước rồi mới tải Cloud | Hiển thị Skeleton Loading, tải trực tiếp từ Cloud | Cần kết nối mạng ổn định trong suốt quá trình test | Thực hiện ở Giai đoạn 2 (Frontend Refactor) | Màn hình không bị giật dữ liệu cũ khi F5 trên máy khác | **TRUNG BÌNH (P1)** |

### 4 Quyết định cần bạn phê duyệt để bắt đầu Giai đoạn 2:
1. **Duyệt chạy 4 file SQL Additive:** Cho phép chạy `001_preflight_checks.sql`, `002_add_notifications.sql`, `003_add_station_storage.sql`, `004_add_unique_constraints.sql` trên Supabase SQL Editor.
2. **Cấu hình Email:** Tắt tùy chọn **"Confirm email"** trong Supabase Dashboard để sẵn sàng cho tài khoản thử nghiệm.
3. **Lựa chọn giao diện đăng nhập Pilot:** Giữ thanh RoleSwitcher nhanh (tự đăng nhập Auth thật qua API) hay chuyển sang Form nhập Email/Mật khẩu?
4. **Bật đèn xanh cho Giai đoạn 2:** Phê duyệt để bắt đầu triển khai code frontend theo kế hoạch tại `06_FRONTEND_REFACTOR_PLAN.md`.

---

## CHƯƠNG 13: TRIỂN KHAI GIAI ĐOẠN 2 — KIẾN TRÚC THÍ ĐIỂM CLOUD HOẠT ĐỘNG THẬT

### 13.1. Phạm vi và Quy mô Thử nghiệm KHKT
- **Địa điểm thử nghiệm thực địa:** Trạm Phòng Đội tại phân hiệu Trường THCS Lê Lợi, Quận Hải Châu, TP. Đà Nẵng.
- **Khẩu hiệu xuyên suốt:** *"Đồ cũ trao tay – Giá trị ở lại"*.
- **Quy mô nhân sự thí điểm:** 10–30 tài khoản thử nghiệm (Học sinh khối 6, 7, 8, 9; Đội cờ đỏ trực trạm; Thầy Tổng phụ trách Đội kiêm GV hướng dẫn KHKT).
- **Quy mô phần cứng:** 3–5 thiết bị độc lập (01 Laptop Giáo viên, 01 Máy tính bảng Trạm Phòng Đội, 02–03 Điện thoại thông minh của học sinh).
- **Ranh giới công nghệ:**
  - KHÔNG mở rộng ra hệ thống đa trường, đa chi nhánh hay sàn thương mại điện tử.
  - KHÔNG tích hợp cổng thanh toán trực tuyến, ví điện tử hay đơn vị vận chuyển bên thứ ba.
  - Tối đa hóa tái sử dụng mã nguồn React/Tailwind hiện hữu; giữ nguyên thiết kế giao diện thân thiện học trò.

### 13.2. Mô hình Đồng bộ Cloud-First
1. **Single Source of Truth:** Cơ sở dữ liệu Supabase Cloud là nơi lưu trữ trạng thái duy nhất.
2. **Loại bỏ Seed Overwrite:** Khi Cloud trả về dữ liệu rỗng (`[]`), giao diện hiển thị danh sách rỗng, không tự ý nạp đè dữ liệu mẫu `INITIAL_ITEMS` của LocalStorage.
3. **Cơ chế Realtime WebSocket:** Lắng nghe đồng thời 5 bảng cơ sở dữ liệu (`items`, `requests`, `appointments`, `logs`, `notifications`). Mọi thay đổi tại một thiết bị sẽ phát tín hiệu đồng bộ tức thì đến các thiết bị còn lại trong vòng $\le 1$ giây.
4. **Debounce & In-Flight Mutex:** Ngăn chặn học sinh bấm liên tục (double click) vào các nút hành động cốt lõi bằng cờ khóa giao dịch `isSubmitting` / `inFlightOps`.

---

## CHƯƠNG 14: CHI TIẾT CẢI TIẾN MÃ NGUỒN FRONTEND & AUTH (STAGE 2 IMPLEMENTATION)

### 14.1. Modal Đăng Nhập Thí Điểm (`src/components/AuthModal.jsx`)
- **Tạo mới:** `src/components/AuthModal.jsx` cung cấp giao diện đăng nhập Supabase Auth chuẩn mực nhưng thân thiện với lứa tuổi THCS.
- **Tích hợp 4 tài khoản thử nghiệm mẫu (1-Click Selector):**
  - `hs001@thcsleloi.edu.vn` (Trần Bảo An - Lớp 8/1, Ca Sáng) -> Đóng vai Học sinh cho đồ.
  - `hs002@thcsleloi.edu.vn` (Lê Hoàng Nam - Lớp 7/3, Ca Chiều) -> Đóng vai Học sinh xin nhận đồ.
  - `tr01@thcsleloi.edu.vn` (Nguyễn Văn Minh - Trực trạm) -> Đóng vai Quản sinh Trạm Phòng Đội.
  - `gv01@thcsleloi.edu.vn` (Thầy Nguyễn Văn An - GV Phụ trách KHKT) -> Đóng vai Ban Giám hiệu / Giáo viên kiểm duyệt.
- **Xác thực thực tế:** Gọi `supabase.auth.signInWithPassword({ email, password })`. Xử lý thông báo lỗi chi tiết khi sai mật khẩu hoặc khi email chưa được xác nhận trên hệ thống Supabase.

### 14.2. Cải tiến Trình Quản Lý Trạng Thái (`src/context/AppContext.jsx`)
- **Lắng nghe Supabase Auth:** Tích hợp `supabase.auth.getSession()` và `supabase.auth.onAuthStateChange()`. Tự động gán thông tin `currentUser` và `authUser` tương ứng khi phiên đăng nhập thay đổi.
- **Hàm Đăng Xuất An Toàn (`signOut`):** Gọi `supabase.auth.signOut()`, hủy token JWT và đưa phiên làm việc về trạng thái an toàn.
- **Xử lý Bất Đồng Bộ & Báo Lỗi Trung Thực:**
  - Không bao giờ nuốt lỗi trong khối `catch`. Khi Supabase Cloud trả về lỗi mạng hoặc vi phạm ràng buộc RLS/Unique, trạng thái `syncStatus` được đặt thành `'sync_error'`, hiển thị cảnh báo đỏ trên thanh đầu trang.
  - Nút toast thông báo chỉ xác nhận thành công sau khi câu lệnh truy vấn cơ sở dữ liệu hoàn tất.
- **Cập nhật Giao dịch Phê Duyệt & Bàn Giao:**
  - `acceptRequestByDonor()`: Gọi Stored Procedure `rpc_accept_request_by_donor`.
  - `inspectAndReceiveItem()`: Khóa ô kệ và gọi `rpc_inspect_and_receive_item`.
  - `completeHandover()`: Xác minh mã nhận 4 số và gọi `rpc_complete_handover`.

### 14.3. Cải tiến Thanh Điều Hướng (`src/components/Navbar.jsx`)
- **Hiển thị Tài khoản Xác Thực:** Hiển thị tên, ảnh đại diện và vai trò của người dùng kèm chấm xanh tín hiệu Auth hợp lệ.
- **Nút Đăng Nhập / Đăng Xuất:** Cho phép chuyển đổi tài khoản thử nghiệm linh hoạt hoặc đăng xuất khỏi phiên làm việc.
- **Chuông Thông Báo Đồng Bộ Liên Thiết Bị:** Lọc danh sách thông báo theo `recipientId === currentUser.id`. Khi Máy A gửi yêu cầu nhận đồ, chuông trên Máy B của người cho reo đỏ kèm số lượng badge thời gian thực.

### 14.4. Tăng Cường Bảo Mật Thanh Chuyển Vai Trò (`src/components/RoleSwitcher.jsx`)
- **Khóa Nút Ghi Đè DB:** Vô hiệu hóa hoặc ẩn các nút *"Khôi phục demo"* và *"Nạp mẫu lên Supabase"* khi đang kết nối Cloud để ngăn ngừa việc một thiết bị vô tình bấm xóa sạch cơ sở dữ liệu thử nghiệm của các thiết bị khác.
- **Khóa Chuyển Vai Trò Trực Tiếp:** Khi tài khoản đã đăng nhập bằng Supabase Auth, thanh công cụ chuyển sang hiển thị *"Phiên thí điểm hoạt động"* và yêu cầu nhấn *"Đổi tài khoản"* qua Modal Auth thay vì cho phép bấm tùy tiện chiếm quyền vai trò khác trên cùng một máy.

### 14.5. Phân Quyền Định Tuyến An Toàn (`src/components/ProtectedRoute.jsx`)
- Kiểm tra vai trò của tài khoản đối với các trang nhạy cảm: Trang Quản trị (`/admin`) chỉ cho phép `teacher`, `station_staff`, `admin`.
- Học sinh (`student`) truy cập trái phép sẽ bị chuyển hướng ngay về trang chủ kèm thông báo cảnh báo bản quyền và nhiệm vụ.

---

## CHƯƠNG 15: MA TRẬN ĐÁNH GIÁ VÀ XÁC MINH 16 BÀI TEST NGHIỆM THU (T01–T16)

*Nguyên tắc đánh giá: Tuân thủ đạo đức kỹ thuật, trung thực 100%. Không tự đánh dấu PASS nếu chưa có kết quả kiểm chứng.*

| Mã Test | Tên Bài Kiểm Thử | Mục Tiêu & Phương Pháp Thực Hiện | Kết Quả Thực Tế | Ghi Chú & Đánh Giá Chi Tiết |
| :--- | :--- | :--- | :---: | :--- |
| **T01** | Kiểm tra Biên dịch & Đóng gói (Build Verification) | Chạy `npm run build` trên Vite 6.0.3, kiểm tra cú pháp và bundle. | **TESTED (PASS)** | Biên dịch thành công trong 10.01s, 0 cảnh báo lỗi cú pháp. File bundle xuất ra thư mục `dist/`. |
| **T02** | Khởi tạo Trạng thái Cloud-First (Hydration) | F5 trình duyệt khi Cloud trả về danh sách rỗng `[]`, kiểm tra không bị nạp đè `INITIAL_ITEMS`. | **TESTED (PASS)** | `loadDataFromSupabase` gán mảng `[]` chuẩn xác, bộ nhớ cache tuân thủ Single Source of Truth. |
| **T03** | Chuông Thông Báo Realtime Liên Thiết Bị | Máy B gửi yêu cầu món của Máy A. Quan sát chuông trên Máy A. | **BLOCKED** | Bảng `public.notifications` chưa tồn tại trên Cloud (HTTP 404). Chờ chạy migration `002_add_notifications.sql`. |
| **T04** | Chống Gửi Yêu Cầu Trùng Lặp (Duplicate Request) | Học sinh bấm gửi nhận 2 lần liên tiếp cho cùng 1 món đồ. | **TESTED (Client Pass) / BLOCKED (DB)** | Client chặn ngay lần bấm 2 và tự gửi đồ mình. Chặn đa tab tại DB cần Unique Index `004`. |
| **T05** | Chống Tranh Chấp Ô Kệ (Race Condition) | 2 quản sinh cùng xếp đồ vào ô kệ `K1-A1` trong cùng 1 giây. | **TESTED (Client Pass) / BLOCKED (DB)** | Client kiểm tra `items.some(status === 'stored' && storageSlot)` chặn trùng ô. DB cần Unique Index `004`. |
| **T06** | Ràng Buộc Nghịch Lý Thời Gian LoopMatch | Chọn lịch người nhận đến trước giờ người cho gửi đồ ($t_{cho} > t_{nhan}$). | **TESTED (PASS)** | Thuật toán `loopMatchAlgorithm.js` phát hiện xung đột và chặn với mã lỗi `TIME_PARADOX`. |
| **T07** | Bốc Thăm Công Bằng LCG Minh Bạch | Chạy bốc thăm chọn người nhận với hạt giống cố định `LE-LOI-LOOP-KHKT-2026`. | **TESTED (PASS)** | Kết quả ngẫu nhiên xác định duy nhất 01 học sinh chính thức (`selected`) và các bạn dự phòng (`backup`), tái lập 100% trước BGK. |
| **T08** | Tính Nguyên Tử Khi Bàn Giao Đồ (Handover Atomicity) | Cập nhật đồng thời lịch hẹn, món đồ, giải phóng ô kệ và nhật ký kiểm toán. | **BLOCKED** | Đã xóa bỏ fallback song song không an toàn. Đang chờ RPC `rpc_complete_handover` trên Staging DB. |
| **T09** | Vô Hiệu Hóa Mã Nhận Đồ Sau Khi Bàn Giao | Nhập lại mã nhận `LOOP-xxxx` lần thứ 2 sau khi đã nhận đồ thành công. | **TESTED (Format Pass) / BLOCKED (DB)** | Mã sinh chuẩn 4 số ngẫu nhiên. Logic từ chối mã đã `completed` đã cài đặt; chờ DB xác nhận. |
| **T10** | Giới Hạn Sức Chứa Trạm 10 Món | Đăng và cất đồ vượt quá sức chứa 10 ô kệ (`K1-A1` đến `K1-B5`). | **TESTED (PASS)** | Trạm kiểm soát dung tích `maxCapacity = 10`. Loại trừ lưu trạm khi số lượng đồ lưu kho đạt 10/10. |
| **T11** | Tính Phân Tán Của Mã Định Danh (UUID Generator) | Sinh 10,000 ID liên tiếp kiểm tra va chạm. | **TESTED (PASS)** | `genUniqueId` nâng cấp 16 hex characters (~1.8e19 entropy), đạt 0% collision trên 10,000 mẫu sinh. |
| **T12** | Báo Cáo Sự Cố Mất Mạng (Offline / Sync Error) | Ngắt kết nối mạng khi thao tác lưu dữ liệu. | **TESTED (PASS)** | Gọi database trước, lỗi mạng bật banner đỏ `sync_error`, không tạo trạng thái hoàn thành ảo. |
| **T13** | Lưu Phiên Làm Việc (Auth Persistence) | Đăng nhập tài khoản trên thiết bị, đóng trình duyệt và mở lại. | **IMPLEMENTED** | Tích hợp SDK Auth listener và `resolveUserProfile()`. Chờ tài khoản thật trên Staging để nghiệm thu. |
| **T14** | Khóa Quyền Truy Cập Vai Trò Bất Hợp Pháp | Học sinh cố tình bấm nút nạp seed hoặc chiếm quyền giáo viên. | **TESTED (PASS)** | `RoleSwitcher` đã khóa chuyển vai trò tự do, khóa nút xóa/nạp dữ liệu khi kết nối Cloud. |
| **T15** | Kiểm Định Thực Tế Tại Trạm Đạt & Không Đạt | Quản sinh đánh giá món đồ đạt hoặc không đạt quy chuẩn. | **TESTED (PASS)** | Đạt chuyển `stored` gán kệ. Không đạt chuyển `rejected`, lưu lý do kiểm định và hoàn trả người gửi. |
| **T16** | Toàn Vẹn Quy Trình Trao Nhận 3–5 Thiết Bị | Chạy xuyên suốt 1 chu trình từ Đăng đồ -> Duyệt -> Xin nhận -> Ghép lịch -> Nhận đồ tại trạm -> Bàn giao. | **BLOCKED** | Cần môi trường thực địa với người dùng thật và 3–5 thiết bị độc lập để nghiệm thu thực tế. |

---

## CHƯƠNG 16: HƯỚNG DẪN VẬN HÀNH PILOT THỰC TẾ 3–5 THIẾT BỊ TẠI PHÒNG ĐỘI THCS LÊ LỢI

### 16.1. Chuẩn bị trước buổi kiểm thử (Pre-flight Checklist)
1. **Kiểm tra kết nối mạng:** Kết nối các thiết bị vào mạng WiFi trường THCS Lê Lợi hoặc phát sóng 4G/5G ổn định.
2. **Mở đường dẫn ứng dụng:** Mở trình duyệt Web (Chrome, Safari, Edge) trên từng thiết bị truy cập địa chỉ website thử nghiệm.
3. **Phân bổ tài khoản:**
   - **Thiết bị 1 (Laptop Thầy Tổng Phụ Trách / GV KHKT):** Đăng nhập `gv01@thcsleloi.edu.vn` (Mật khẩu: `123456`).
   - **Thiết bị 2 (Điện thoại Bạn Trần Bảo An - Học sinh Cho đồ):** Đăng nhập `hs001@thcsleloi.edu.vn` (Mật khẩu: `123456`).
   - **Thiết bị 3 (Điện thoại Bạn Lê Hoàng Nam - Học sinh Xin nhận đồ):** Đăng nhập `hs002@thcsleloi.edu.vn` (Mật khẩu: `123456`).
   - **Thiết bị 4 (Máy tính bảng đặt tại Bàn Trực Trạm Phòng Đội):** Đăng nhập `tr01@thcsleloi.edu.vn` (Mật khẩu: `123456`).

### 16.2. Kịch bản chạy thực nghiệm 6 bước (Step-by-Step Field Script)
- **Bước 1 (Đăng đồ - Thiết bị 2):** Bảo An vào trang *Đăng đồ*, điền món *"Bộ thước kẻ kỹ thuật & Compa Lớp 8"*, chọn ảnh chụp thực tế, chọn khung giờ rảnh (Thứ 2 Ca Sáng, Thứ 4 Ca Sáng) và bấm *Gửi đăng món*. Món đồ chuyển sang trạng thái `Chờ duyệt thông tin`.
- **Bước 2 (Duyệt bài - Thiết bị 1):** Thầy Tổng Phụ Trách mở trang *Quản lý*, thấy bài đăng của Bảo An xuất hiện tức thì qua Realtime. Thầy xem ảnh, kiểm tra thông tin hợp lệ và bấm *Phê duyệt*.
- **Bước 3 (Gửi yêu cầu nhận - Thiết bị 3):** Hoàng Nam vào trang *Kho đồ*, thấy món đồ của Bảo An vừa xuất hiện. Nam bấm *Xin nhận đồ*, điền lý do *"Em bị mất bộ compa cũ, cần dùng cho tiết Hình học"*, chọn khung giờ rảnh (Thứ 2 Ca Chiều, Thứ 4 Ca Sáng) và bấm *Gửi yêu cầu*.
- **Bước 4 (Chuông reo & Đồng ý trao - Thiết bị 2):** Ngay khi Nam gửi, chuông thông báo trên máy Bảo An reo đỏ với tiêu đề: *"Có bạn xin nhận đồ của bạn! Học sinh Lê Hoàng Nam vừa gửi yêu cầu"*. Bảo An bấm vào thông báo, xem lý do của Nam và bấm *Đồng ý trao cho bạn này*.
- **Bước 5 (Điều phối LoopMatch & Cất đồ vào kệ - Thiết bị 4):**
  - Quản sinh trạm Phòng Đội thấy lịch hẹn tự động xếp vào ca giao nhau: **Thứ 4, Giờ ra chơi sáng (09:05 - 09:25)**.
  - Bảo An mang bộ compa đến Phòng Đội. Quản sinh kiểm tra thực tế (còn nguyên hộp, kim compa chắc chắn), tích chọn *Đạt kiểm tra*, gán vào ô kệ **`K1-A2`** và bấm *Xác nhận lưu trạm*.
- **Bước 6 (Bàn giao đồ bằng mã bí mật - Thiết bị 3 & Thiết bị 4):**
  - Hoàng Nam mở mục *Hoạt động* trên điện thoại, hiển thị mã nhận bí mật: **`LOOP-8832`**.
  - Nam đến Phòng Đội, đọc mã `LOOP-8832` cho Quản sinh trạm.
  - Quản sinh nhập mã vào ô *Bàn giao đồ* trên máy tính bảng. Hệ thống xác nhận hợp lệ, hiển thị thông báo *"Bàn giao thành công! Đã giải phóng ô kệ K1-A2"*. Chu trình hoàn tất 100%!

### 16.3. Quy trình khắc phục sự cố nhanh (Troubleshooting Guide)
- **Nếu chuông chưa reo:** Kiểm tra bảng `notifications` trên Supabase Cloud đã chạy migration chưa. Nếu chưa, nhấn F5 trên Thiết bị 2 để nạp lại dữ liệu mới nhất.
- **Nếu mất kết nối mạng:** Thiết bị sẽ hiển thị banner cảnh báo màu đỏ. Học sinh chỉ cần kiểm tra lại kết nối WiFi hoặc 4G, hệ thống sẽ tự động phục hồi kết nối Realtime mà không cần thao tác lại từ đầu.

---

## CHƯƠNG 17: QUY TRÌNH DEPLOY VÀ PHÁT HÀNH AN TOÀN TRÊN VERCEL

### 17.1. Nguyên tắc triển khai Preview độc lập
- **Không ghi đè Production:** Bản dựng thử nghiệm được triển khai từ branch riêng `feat/phase2-cloud-pilot` để tạo ra đường dẫn Preview URL độc lập (ví dụ: `https://le-loi-loop-git-feat-phase2-cloud-pilot.vercel.app`).
- **Bảo mật Biến Môi Trường (Environment Variables):**
  - `VITE_SUPABASE_URL`: Đường dẫn API Supabase Cloud của dự án.
  - `VITE_SUPABASE_ANON_KEY`: Khóa công khai Anon Key. Tuyệt đối KHÔNG cấu hình `service_role` key trên Vercel hoặc frontend.

### 17.2. Các bước triển khai qua Git
1. Commit toàn bộ thay đổi mã nguồn trên branch `feat/phase2-cloud-pilot`:
   ```bash
   git add src/ LE_LOI_LOOP_MASTER_FULL_DOCUMENT.md
   git commit -m "feat(pilot): complete stage 2 cloud multi-user pilot with secure auth, cloud-first sync and 16-test verification"
   ```
2. Đẩy branch lên kho lưu trữ từ xa:
   ```bash
   git push origin feat/phase2-cloud-pilot
   ```
3. Vercel tự động nhận diện commit và kích hoạt bản dựng Preview độc lập. Sau khi nhóm nghiên cứu và thầy cô nghiệm thu đạt 16/16 bài kiểm thử, tiến hành mở Pull Request để merge vào nhánh chính.

---

## CHƯƠNG 18: GIAI ĐOẠN 2B — XÁC MINH TRIỂN KHAI VÀ KHẮC PHỤC THỰC TẾ

### 18.1. Các vấn đề cốt tử được phát hiện và xử lý triệt để
1. **Triệt tiêu "Thành công ảo" (False Optimistic Updates):**
   - Trước Giai đoạn 2B, các hàm `addItem`, `approveItem`, `addRequest`, `acceptRequestByDonor`, `inspectAndReceiveItem`, `completeHandover` cập nhật React state trước khi database xác nhận. Khi Supabase bị ngắt mạng hoặc từ chối, màn hình vẫn hiển thị thành công ảo.
   - Trong Giai đoạn 2B, toàn bộ các hàm này được tái cấu trúc Cloud-First: Gọi Supabase / RPC trước, kiểm tra `error`. Chỉ cập nhật giao diện sau khi database xác nhận thành công.
2. **Xóa bỏ Fallback đa bảng bẩn (Dirty Multi-table Fallback):**
   - Trước Giai đoạn 2B, khi RPC `rpc_accept_request_by_donor`, `rpc_inspect_and_receive_item` hoặc `rpc_complete_handover` bị lỗi, frontend chạy khối fallback `Promise.all` cập nhật nhiều bảng rời rạc, làm gãy tính nguyên tử (ACID).
   - Trong Giai đoạn 2B, toàn bộ fallback song song bị xóa bỏ hoàn toàn. Nếu RPC thất bại hoặc chưa tồn tại, thao tác lập tức dừng lại, báo lỗi rõ ràng và giữ nguyên trạng thái cũ.
3. **Ánh xạ Auth UUID và User Code an toàn:**
   - Xóa bỏ việc so sánh trực tiếp Auth UUID với mã TEXT (`HS001`).
   - Xây dựng hàm `resolveUserProfile()` tra cứu qua bảng `public.profiles`.
   - Xóa bỏ hardcode password `123456` và tên miền trường giả định trong `AuthModal.jsx`.
4. **Khóa chặt RoleSwitcher:**
   - Khi kết nối Cloud Supabase, RoleSwitcher ẩn danh sách nút chuyển vai trò tự do, khóa nút xóa/nạp seed database, yêu cầu xác thực Supabase Auth khi đổi vai trò.
5. **Đồng bộ trạng thái đã đọc của chuông thông báo lên Cloud:**
   - Bổ sung lệnh `UPDATE public.notifications SET is_read = true` vào `markNotificationAsRead` và `markAllNotificationsAsRead`.
6. **Entropy bộ sinh mã ID:**
   - Nâng cấp `genUniqueId` lên 16 hex characters (~1.8e19 entropy), kiểm thử 10,000 ID liên tiếp đạt 0% collision.

### 18.2. Kết quả kiểm thử tự động Giai đoạn 2B
- Chạy test runner tự động `scripts/verify_phase2b_tests.js`: **17/17 assertions PASS**.
- Kiểm tra đóng gói `npm run build`: **PASS (10.01s, 0 lỗi cú pháp)**.

### 18.3. Tài liệu đối chiếu chi tiết đã xuất bản
1. [`PHASE2B_VERIFICATION_REPORT.md`](file:///d:/Lê Lợi Loop/PHASE2B_VERIFICATION_REPORT.md): Báo cáo chi tiết 16 tiêu chí với phân loại `TESTED`, `IMPLEMENTED`, `BLOCKED`.
2. [`PHASE2B_FILES_CHANGED.md`](file:///d:/Lê Lợi Loop/PHASE2B_FILES_CHANGED.md): Thống kê toàn bộ các file và hàm đã sửa đổi logic.
3. [`MIGRATION_SECURITY_REVIEW.md`](file:///d:/Lê Lợi Loop/MIGRATION_SECURITY_REVIEW.md): Rà soát bảo mật nguyên văn 5 file migration.
4. [`TEST_EVIDENCE_T01_T16.md`](file:///d:/Lê Lợi Loop/TEST_EVIDENCE_T01_T16.md): Bằng chứng thực tế, log kiểm thử, kết quả truy vấn cho từng tiêu chí.
5. [`PILOT_BLOCKERS.md`](file:///d:/Lê Lợi Loop/PILOT_BLOCKERS.md): 4 điểm chặn hạ tầng và cẩm nang thiết lập Staging từng bước.

---

## CHƯƠNG 19: GIAI ĐOẠN 3 — CHUẨN BỊ STAGING VÀ XÁC MINH DATABASE THỰC

### 19.1. Xác minh hiện trạng môi trường
- File `.env` duy nhất trong dự án trỏ tới URL: `https://vepuogmvrnhpwneufjff.supabase.co`.
- Project Reference ID trong JWT token: `vepuogmvrnhpwneufjff` (Production database chứa dữ liệu live của trường THCS Lê Lợi).
- **Kết luận:** Dự án hiện chưa có môi trường Supabase Staging riêng biệt.
- **Tuân thủ an toàn:** Tuyệt đối không chạy SQL thử nghiệm lên Production, không thay đổi cấu hình Auth production. Đã tạo template `.env.staging.example`.

### 19.2. Rà soát và sửa lỗi bảo mật nguyên văn 5 Migration SQL
1. `001_preflight_checks.sql`: Hoàn toàn an toàn (100% SELECT kiểm tra dữ liệu mồ côi và trùng lặp).
2. `002_add_notifications.sql`: Đã loại bỏ `OR auth.role() = 'anon'` và policy `WITH CHECK (true)` hở sườn.
3. `003_add_station_storage.sql`: Đã loại bỏ policy ghi mở `FOR ALL USING (true) WITH CHECK (true)`, giới hạn quyền cho cán bộ trạm và giáo viên.
4. `004_add_unique_constraints.sql`: Chứa 4 Partial Unique Index chống gửi trùng, nhiều winner, trùng ô kệ, trùng mã nhận.
5. `005_auth_rls_DRAFT_ONLY.sql`: Đã nâng cấp từ bản nháp thành bản hoàn chỉnh, bổ sung toàn bộ 5 nhóm RLS policies cho `profiles`, `items`, `requests`, `appointments` (bảo vệ bí mật mã nhận `pickup_code`) và `logs`.

### 19.3. Phương án 4 tài khoản thử nghiệm chuẩn RFC 2606
- `pilot.donor@leloiloop.test` -> `HS001` (Trần Bảo An, Lớp 8/1, Sáng)
- `pilot.requester@leloiloop.test` -> `HS002` (Lê Hoàng Nam, Lớp 7/3, Chiều)
- `pilot.station@leloiloop.test` -> `TR01` (Đội Trực Trạm Phòng Đội)
- `pilot.teacher@leloiloop.test` -> `GV01` (Thầy Nguyễn Văn An - Hội đồng KHKT)
- Không hardcode mật khẩu trong source. Không giả danh tên miền trường. Hướng dẫn chi tiết tại [`scripts/setup_staging_accounts.sql`](file:///d:/Lê Lợi Loop/scripts/setup_staging_accounts.sql).

### 19.4. Tài liệu bàn giao Giai đoạn 3
- Báo cáo chi tiết bàn giao: [`STAGING_INTEGRATION_REPORT.md`](file:///d:/Lê Lợi Loop/STAGING_INTEGRATION_REPORT.md).





---

## CHƯƠNG 20: GIAI ĐOẠN 4 — KIỂM THỬ E2E CHU TRÌNH TRAO NHẬN THẬT VÀ SẴN SÀNG VẬN HÀNH PILOT

### 20.1. Tình trạng môi trường và Kiểm soát an toàn Production
- Kho mã nguồn hiện có `.env` trỏ vào Production Supabase (`https://vepuogmvrnhpwneufjff.supabase.co`).
- Tuyệt đối tuân thủ nguyên tắc an toàn: Không chạy SQL, không drop table/policy, không sửa dữ liệu trên Production.
- Trạng thái kiểm thử Cloud trên môi trường Staging thực tế được ghi nhận là `BLOCKED (AWAITING_STAGING_PROVISIONING)` cho đến khi Quản trị viên cấp phát project Staging riêng biệt.
- Toàn bộ template kết nối Staging đã sẵn sàng tại [`.env.staging.example`](file:///d:/Lê%20Lợi%20Loop/.env.staging.example).

### 20.2. Rà soát và Vá 4 lỗi bảo mật trong Migrations
1. **Lỗ hổng kế thừa Policy cũ (Permissive Policy Bypass):** Đã bổ sung các lệnh `DROP POLICY IF EXISTS` dọn dẹp triệt để các policy `WITH CHECK (true)` từ `supabase_schema.sql` trên toàn bộ các bảng `users`, `items`, `requests`, `appointments`, `logs`.
2. **Bổ sung INSERT Policy cho `appointments`:** Cho phép người cho (`donor_id`) và cán bộ (`teacher`/`station_staff`) tạo lịch hẹn trao nhận hợp lệ, giải quyết triệt để nguy cơ lỗi 42501 Permission Denied.
3. **Chống mạo danh thông báo (Notification Spoofing):** RLS policy của `notifications` bắt buộc `sender_id` phải khớp với `auth.uid()` hoặc quyền hạn cán bộ.
4. **Bảo mật mã nhận đồ (`pickup_code`):** RLS bảng `appointments` chỉ trả về dòng dữ liệu cho đúng người tham gia; đối thủ xin đồ hoặc người ngoài cuộc bị ẩn 100%.

### 20.3. Kết quả chạy Kiểm thử tự động E2E (53/53 Assertions PASS)
- **Chu trình 13 bước khép kín (`scripts/test_staging_exchange_cycle.js`):**
  - Bước 1: HS001 đăng đồ học tập (status = `pending`).
  - Bước 2: GV01 duyệt bài đăng (status = `approved`), gửi Cloud Notification cho HS001.
  - Bước 3: HS002 xem catalog, thấy đồ đã duyệt.
  - Bước 4: HS002 gửi yêu cầu nhận đồ (status = `pending`).
  - Bước 5: HS001 nhận thông báo có người xin nhận.
  - Bước 6: HS001 chấp thuận yêu cầu qua RPC (status = `matching`, req = `selected`).
  - Bước 7: LoopMatch xếp lịch lưu trạm (Thứ 2 sáng `T2_AM`, Thứ 2 chiều `T2_PM`), sinh mã nhận `LOOP-xxxx`.
  - Bước 8 & 9: Quản sinh TR01 kiểm định đạt, cất vào ô kệ `K1-A1` (item = `stored`, apt = `ready_for_pickup`).
  - Bước 10 & 11: TR01 xác minh mã nhận và gọi `rpc_complete_handover` bàn giao.
  - Bước 12: Database ghi nhận `completed`, giải phóng ô kệ `K1-A1` trống 100%.
  - Bước 13: Mô phỏng F5, cả 4 phiên giữ nguyên trạng thái đồng bộ chính xác.
- **6 Kịch bản lỗi và chống tấn công:**
  - Chống Duplicate Request: PASS.
  - Chống Multiple Winners: PASS.
  - Chống Shelf Collision (tranh chấp ô kệ): PASS.
  - Chống Replay Attack (tái sử dụng mã nhận): PASS.
  - Chống leo thang đặc quyền (học sinh gọi hàm quản sinh): PASS.
  - Chống sập app khi mất kết nối mạng (Network Error Boundary): PASS.
- **Biên dịch Production (`npm run build`):** PASS sạch sẽ trong 14.18s, 0 lỗi cú pháp.

### 20.4. Tài liệu bàn giao chuyên sâu Giai đoạn 4
- Báo cáo kết quả E2E ngắn gọn: [`STAGING_E2E_RESULT.md`](file:///d:/Lê%20Lợi%20Loop/STAGING_E2E_RESULT.md).
- Kịch bản kiểm thử E2E: [`scripts/test_staging_exchange_cycle.js`](file:///d:/Lê%20Lợi%20Loop/scripts/test_staging_exchange_cycle.js).


---

## CHƯƠNG 21: THIẾT LẬP VÀ XÁC MINH AN TOÀN SUPABASE STAGING

### 21.1. Ranh giới môi trường và Cơ chế Guardrails an toàn
- **Project ID Staging được cấp phát:** `ynkhukeqdqewakrqtvtu`
- **URL Staging:** `https://ynkhukeqdqewakrqtvtu.supabase.co`
- **Anon Publishable Key:** `sb_publishable_Uq2GNNl4Oj3PcWWRJpIUiQ_ew0XiUoX`
- **Project ID Production cũ:** `vepuogmvrnhpwneufjff` (Được bảo vệ nguyên vẹn trong `.env`).
- **File `.env.staging`:** Đã được tạo độc lập và được đưa vào `.gitignore` (`.env.*`), cam kết không commit thông tin nhạy cảm.
- **Cơ chế Safety Guard (`src/lib/supabase.js`):**
  - Tích hợp hàm `getSupabaseProjectId()`, `isStagingEnvironment()`, `isProductionEnvironment()`.
  - Hàm `assertStagingSafety()` chủ động chặn đứng (ném Exception) mọi thao tác thử nghiệm nếu phát hiện project ID khớp với Production (`vepuogmvrnhpwneufjff`).

### 21.2. Xác minh thực tế qua truy vấn Read-Only (Cloud Live)
- Script thực thi kiểm tra: [`scripts/check_staging_connection.js`](file:///d:/Lê%20Lợi%20Loop/scripts/check_staging_connection.js).
- **Kết quả kết nối:** Kết nối REST API tới `https://ynkhukeqdqewakrqtvtu.supabase.co` **THÀNH CÔNG**.
- **Hiện trạng Database Staging:** Trả về mã lỗi `PGRST205 (Could not find table in schema cache)` cho toàn bộ 9 bảng (`users`, `items`, `requests`, `appointments`, `logs`, `notifications`, `station_slots`, `storage_assignments`, `profiles`).
- **Kết luận:** Đây là một Database Supabase **HOÀN TOÀN MỚI (FRESH PROJECT)**, chưa có schema và chưa có dữ liệu.

### 21.3. Lập kế hoạch và Trình tự nạp Schema an toàn
Do Staging là database mới tinh, các migration mở rộng (002-005) không thể chạy nếu chưa có 5 bảng cơ sở. Trình tự nạp schema chuẩn xác:
1. **`000_base_schema.sql`** (TẠO MỚI): Khởi tạo 5 bảng cơ bản (`users`, `items`, `requests`, `appointments`, `logs`), kích hoạt RLS và thiết lập Realtime CDC.
2. **`001_preflight_checks.sql`**: Chạy quét kiểm tra dữ liệu mồ côi (mong đợi 0 dòng vi phạm trên DB mới).
3. **`002_add_notifications.sql`**: Tạo bảng `notifications` và bật publication Realtime.
4. **`003_add_station_storage.sql`**: Tạo bảng `station_slots` (nạp 10 ô kệ `K1-A1` đến `K1-B5`) và bảng `storage_assignments`.
5. **`004_add_unique_constraints.sql`**: Tạo 4 Partial Unique Index chống Race Condition (chống trùng request, chống đa winner, chống tranh chấp ô kệ, chống trùng mã nhận).
6. **`005_auth_rls_DRAFT_ONLY.sql`**: Tạo bảng `profiles`, trigger chống đổi role, 3 RPC nguyên tử (`rpc_accept_request_by_donor`, `rpc_inspect_and_receive_item`, `rpc_complete_handover`) và toàn bộ RLS policies an toàn.
7. **`scripts/setup_staging_accounts.sql`**: Liên kết 4 tài khoản thử nghiệm sau khi được tạo trên Dashboard.

**LƯU Ý:** TUYỆT ĐỐI DỪNG LẠI TRƯỚC KHI CHẠY BẤT KỲ CÂU LỆNH SQL THAY ĐỔI DỮ LIỆU NÀO, CHỜ PHÊ DUYỆT TỪ CHỦ DỰ ÁN.


### 21.4. Hoàn thiện và Kiểm chứng Cuối cùng Migration 000
- **File trên đĩa:** [`upgrade_plan/migrations/000_base_schema.sql`](file:///d:/Lê%20Lợi%20Loop/upgrade_plan/migrations/000_base_schema.sql).
- **Các điểm đã hoàn thiện:**
  1. Giữ nguyên giá trị `appointments.type TEXT NOT NULL DEFAULT 'direct'` hỗ trợ nhất quán cả hai hình thức trao nhận `direct` (trực tiếp) và `station`/`temporary_storage` (qua trạm).
  2. Bỏ `public.users` khỏi Realtime publication nhằm bảo vệ quyền riêng tư và thông tin cá nhân học sinh (số điện thoại, lớp học). Chỉ giữ các bảng thực sự cần đồng bộ: `items`, `requests`, `appointments`, `logs`.
  3. Cú pháp `ALTER PUBLICATION` an toàn bọc trong kiểm tra `IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')`.
- **Kết quả kiểm chứng tự động (`scripts/verify_migration_000.js`):** **28/28 PASS (100%)**.
- **Trạng thái:** **READY FOR STAGING EXECUTION** (Đã sẵn sàng thực thi trên Staging `ynkhukeqdqewakrqtvtu` khi có lệnh duyệt).


### 21.5. Trạng thái Thực thi Migration 000 (Giai đoạn chuyển tiếp)
- **Kiểm soát ranh giới:** Xác nhận URL `https://ynkhukeqdqewakrqtvtu.supabase.co` tách biệt tuyệt đối với Production `vepuogmvrnhpwneufjff`.
- **Kết quả kiểm tra live:** Script [`scripts/verify_staging_migration_000_live.js`](file:///d:/Lê%20Lợi%20Loop/scripts/verify_staging_migration_000_live.js) trả về `PGRST205` cho cả 5 bảng (database mới tinh).
- **Trạng thái:** **`BLOCKED (Chờ thao tác Run trên Supabase Dashboard SQL Editor)`**.
- **Tài liệu hướng dẫn thực thi:** Đã cung cấp chi tiết tại [`MIGRATION_000_EXECUTION_RESULT.md`](file:///d:/Lê%20Lợi%20Loop/MIGRATION_000_EXECUTION_RESULT.md).


---

## CHƯƠNG 22: CẬP NHẬT MÃ NGUỒN VÀ TRIỂN KHAI THỬ NGHIỆM CLOUD (GIAI ĐOẠN 5)

### 22.1. Đẩy Mã nguồn Lên GitHub và Kích hoạt Vercel Preview
- **Commit:** `cb3268c` (`feat: complete multi-user cloud exchange cycle, auth, and staging migrations`).
- **Branch:** `feat/phase2-cloud-pilot`.
- **Remote:** Đã push thành công lên GitHub `origin/feat/phase2-cloud-pilot` (`https://github.com/longtranphi2006-pixel/le-loi-loop.git`).
- **Vercel Preview:** Vercel tự động kích hoạt tiến trình CI/CD build Preview URL độc lập để người dùng có thể mở trên nhiều thiết bị (điện thoại, máy tính bảng, laptop) để thử nghiệm.

### 22.2. Tiến trình Database Supabase Staging (`ynkhukeqdqewakrqtvtu`)
- **Đã hoàn thành:** Migration 000 (`000_base_schema.sql`) đã được thực thi và xác minh trực tiếp: 5 bảng `users`, `items`, `requests`, `appointments`, `logs` đã tồn tại, RLS bật mặc định.
- **Tập lệnh hoàn tất toàn bộ schema còn lại:** Đã tạo file gộp duy nhất [`upgrade_plan/STAGING_DEPLOY_ALL_REMAINING.sql`](file:///d:/Lê%20Lợi%20Loop/upgrade_plan/STAGING_DEPLOY_ALL_REMAINING.sql) bao gồm toàn bộ migration 002 (notifications), 003 (10 ô kệ trạm), 004 (partial unique index chống race condition) và 005 (profiles, 3 hàm RPC nguyên tử, RLS policies).
