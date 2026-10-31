# 01_DB_INVENTORY.md: KIỂM KÊ TOÀN DIỆN CƠ SỞ DỮ LIỆU LIVE & SCHEMA
**Dự án:** LÊ LỢI LOOP  
**Hệ quản trị cơ sở dữ liệu:** PostgreSQL (Hosted trên Supabase Cloud)  
**Địa chỉ Endpoint:** `https://vepuogmvrnhpwneufjff.supabase.co`  
**Quyền truy cập kiểm tra:** READ-ONLY qua REST API (Anon Key)  
**Ngày kiểm kê:** 30/10/2026  

---

## 1. BẢNG TỔNG KẾT TRẠNG THÁI CÁC BẢNG TRÊN SUPABASE LIVE

| Tên Bảng (Table Name) | Trạng thái Live | Số dòng hiện có (Live Count) | Khóa chính (PK) | Khóa ngoại (FK) | Bằng chứng xác minh |
| :--- | :---: | :---: | :--- | :--- | :---: |
| **`public.users`** | **TỒN TẠI** | **4 dòng** | `id (TEXT)` | Không | **VERIFIED LIVE (HTTP 200)** |
| **`public.items`** | **TỒN TẠI** | **12 dòng** | `id (TEXT)` | `donor_id -> users(id)` | **VERIFIED LIVE (HTTP 200)** |
| **`public.requests`** | **TỒN TẠI** | **5 dòng** | `id (TEXT)` | `item_id -> items(id)`<br>`requester_id -> users(id)` | **VERIFIED LIVE (HTTP 200)** |
| **`public.appointments`**| **TỒN TẠI** | **3 dòng** | `id (TEXT)` | `item_id -> items(id)`<br>`request_id -> requests(id)`<br>`donor_id -> users(id)`<br>`requester_id -> users(id)` | **VERIFIED LIVE (HTTP 200)** |
| **`public.logs`** | **TỒN TẠI** | **5 dòng** | `id (TEXT)` | Không | **VERIFIED LIVE (HTTP 200)** |
| **`public.notifications`**| ❌ **KHÔNG TỒN TẠI** | **0 (HTTP 404)** | Chưa có | Chưa có | **VERIFIED LIVE (PGRST205)** |
| **`public.station_slots`**| ❌ **KHÔNG TỒN TẠI** | **Chưa có** | Chưa có | Chưa có | Đang hardcode trong `seedData.js` |
| **`public.storage_assignments`**| ❌ **KHÔNG TỒN TẠI**| **Chưa có** | Chưa có | Chưa có | Đang lưu trực tiếp cột `storage_slot` |

---

## 2. CHI TIẾT CẤU TRÚC TỪNG BẢNG LIVE (COLUMNS & DATA TYPES)

### 2.1. Bảng `public.users` (4 bản ghi: HS001, HS002, TR01, GV01)
- `id` (TEXT, PK): Mã người dùng (ví dụ: `HS001`).
- `name` (TEXT, NOT NULL): Họ và tên đầy đủ.
- `role` (TEXT, NOT NULL, DEFAULT 'student'): Vai trò (`student`, `station_staff`, `teacher`, `admin`).
- `class` (TEXT): Lớp học (ví dụ: `7/1`, `8/2`).
- `shift` (TEXT): Ca học buổi sáng hay chiều.
- `avatar` (TEXT): URL ảnh đại diện.
- `phone` (TEXT): Số điện thoại liên lạc.
- `points` (INTEGER, DEFAULT 0): Điểm tích lũy hoạt động tuần hoàn xanh.
- `bio` (TEXT): Giới thiệu ngắn.
- `created_at` (TIMESTAMPTZ, DEFAULT NOW()): Thời điểm tạo.

### 2.2. Bảng `public.items` (12 bản ghi: M001 đến M012)
- `id` (TEXT, PK): Mã món đồ (ví dụ: `M001`, `M002`).
- `title` (TEXT, NOT NULL): Tiêu đề món đồ học tập.
- `category` (TEXT, NOT NULL): Phân loại (`sgk`, `dungcu`, `truyen`, `cap`, `dongphuc`, `stk`).
- `condition` (TEXT, NOT NULL): Tình trạng (Tốt, Như mới, Đã dùng còn tốt).
- `description` (TEXT): Mô tả chi tiết món đồ.
- `donor_id` (TEXT, FK -> users.id): Người cho tặng.
- `donor_name` (TEXT): Tên hiển thị người cho.
- `available_slots` (JSONB, DEFAULT '[]'): Mảng các khung giờ rảnh của người cho (ví dụ: `["T2_PM", "T3_PM"]`).
- `input_method` (TEXT, DEFAULT 'website'): Nguồn đăng (`website` hoặc `paper` - phiếu giấy).
- `status` (TEXT, NOT NULL, DEFAULT 'pending'): Trạng thái (`pending`, `approved`, `matching`, `stored`, `completed`, `rejected`, `needs_update`).
- `request_status` (TEXT, NOT NULL, DEFAULT 'open'): Trạng thái nhận yêu cầu (`open`, `closed`).
- `image` (TEXT): URL hình ảnh món đồ.
- `quality_check` (JSONB, DEFAULT NULL): Kết quả kiểm định thực tế (`{ "passed": true, "note": "...", "checkedBy": "..." }`).
- `storage_slot` (TEXT, DEFAULT NULL): Vị trí ô kệ lưu trữ tại trạm (ví dụ: `K1-A1`).
- `reject_reason` (TEXT): Lý do từ chối bài đăng.
- `update_note` (TEXT): Ghi chú yêu cầu bổ sung thông tin.
- `created_at` (TIMESTAMPTZ, DEFAULT NOW()): Thời gian đăng.

### 2.3. Bảng `public.requests` (5 bản ghi: REQ-001 đến REQ-005)
- `id` (TEXT, PK): Mã yêu cầu nhận đồ (ví dụ: `REQ-001`).
- `item_id` (TEXT, NOT NULL, FK -> items.id): Món đồ xin nhận.
- `requester_id` (TEXT, NOT NULL, FK -> users.id): Học sinh gửi yêu cầu xin nhận.
- `requester_name` (TEXT, NOT NULL): Tên học sinh xin nhận.
- `requester_class` (TEXT): Lớp học của học sinh.
- `reason` (TEXT, NOT NULL): Lý do xin nhận đồ.
- `available_slots` (JSONB, DEFAULT '[]'): Khung giờ rảnh của người xin nhận.
- `input_method` (TEXT, DEFAULT 'website'): Hình thức gửi yêu cầu.
- `status` (TEXT, NOT NULL, DEFAULT 'pending'): Trạng thái xét chọn (`pending`, `selected`, `backup`, `rejected`).
- `lottery_rank` (INTEGER, DEFAULT NULL): Thứ hạng sau bốc thăm LCG (1: Chính thức, 2: Dự phòng).
- `created_at` (TIMESTAMPTZ, DEFAULT NOW()): Thời gian tạo.

### 2.4. Bảng `public.appointments` (3 bản ghi: APT-101, APT-102, APT-103)
- `id` (TEXT, PK): Mã lịch hẹn (ví dụ: `APT-101`).
- `item_id` (TEXT, NOT NULL, FK -> items.id): Món đồ trao nhận.
- `request_id` (TEXT, FK -> requests.id): Yêu cầu trúng tuyển tương ứng.
- `donor_id` (TEXT, FK -> users.id): Học sinh cho đồ.
- `requester_id` (TEXT, FK -> users.id): Học sinh nhận đồ.
- `type` (TEXT, NOT NULL, DEFAULT 'direct'): Hình thức (`direct` - trực tiếp cùng ca; `temporary_storage` - lưu kho trạm).
- `donor_slot` (TEXT, NOT NULL): Khung giờ người cho đến gửi đồ (ví dụ: `T2_PM`).
- `requester_slot` (TEXT, NOT NULL): Khung giờ người nhận đến lấy đồ (ví dụ: `T3_AM`).
- `storage_slot` (TEXT, DEFAULT NULL): Ô kệ gán tại trạm.
- `pickup_code` (TEXT, NOT NULL, UNIQUE): Mã nhận đồ 4 chữ số bí mật (ví dụ: `LOOP-7821`).
- `status` (TEXT, NOT NULL, DEFAULT 'scheduled'): Trạng thái (`scheduled`, `ready_for_pickup`, `completed`, `cancelled`, `failed_inspection`).
- `donor_arrived_at` (TIMESTAMPTZ, DEFAULT NULL): Thời điểm người cho mang đồ đến trạm.
- `picked_up_at` (TIMESTAMPTZ, DEFAULT NULL): Thời điểm người nhận đã nhận đồ.
- `notes` (TEXT): Ghi chú điều phối trạm.
- `created_at` (TIMESTAMPTZ, DEFAULT NOW()): Thời gian tạo lịch.

### 2.5. Bảng `public.logs` (5 bản ghi: LOG-001 đến LOG-005)
- `id` (TEXT, PK): Mã bản ghi kiểm toán (ví dụ: `LOG-001`).
- `timestamp` (TIMESTAMPTZ, DEFAULT NOW()): Thời điểm phát sinh hành động.
- `role` (TEXT, NOT NULL): Định danh người thực hiện (ví dụ: `GV01 (Thầy Nguyễn Văn A)`).
- `action` (TEXT, NOT NULL): Hành động nghiệp vụ (ví dụ: `KHỞI TẠO HỆ THỐNG`, `BÀN GIAO THÀNH CÔNG`).
- `details` (TEXT, NOT NULL): Chi tiết nghiệp vụ.
- `created_at` (TIMESTAMPTZ, DEFAULT NOW()): Thời gian ghi nhận.

---

## 3. KIỂM TRA ROW LEVEL SECURITY (RLS) VÀ QUYỀN TRUY CẬP TRÊN LIVE

| Bảng | RLS Enabled? | Chính sách hiện hành (Current Policy) | Nguy cơ bảo mật |
| :--- | :---: | :--- | :--- |
| `users` | CÓ | `SELECT`, `INSERT`, `UPDATE` mở cho `public` (`USING true`) | Bất kỳ ai có Anon Key đều có thể cập nhật thông tin user. |
| `items` | CÓ | `SELECT`, `INSERT`, `UPDATE`, `DELETE` mở cho `public` | Bất kỳ ai cũng có thể xóa hoặc sửa món đồ của người khác. |
| `requests` | CÓ | `SELECT`, `INSERT`, `UPDATE`, `DELETE` mở cho `public` | Bất kỳ ai cũng có thể sửa kết quả xét chọn yêu cầu. |
| `appointments` | CÓ | `SELECT`, `INSERT`, `UPDATE` mở cho `public` | Mã nhận đồ `pickup_code` bị công khai qua API đọc bảng. |
| `logs` | CÓ | `SELECT`, `INSERT` mở cho `public` | Bất kỳ ai cũng có thể chèn log giả mạo vào hệ thống. |
| `notifications` | ❌ | **Chưa có bảng** | Không áp dụng. |

---

## 4. KIỂM TRA HỆ THỐNG SUPABASE AUTH TRÊN LIVE

Đã thực hiện truy vấn thăm dò cấu hình Auth qua REST endpoint `/auth/v1/settings`:
- **Đăng ký Email:** Được bật (`email: true`).
- **Cho phép Signup:** Được bật (`disable_signup: false`).
- **Tự động xác nhận Email (Auto-confirm):** **ĐANG TẮT (`mailer_autoconfirm: false`)**.
  > [!WARNING]
  > **Ý NGHĨA KỸ THUẬT QUAN TRỌNG:** Vì `mailer_autoconfirm` đang là `false`, nếu người dùng tự gọi `supabase.auth.signUp()` với email giả lập (ví dụ `HS001@leloiloop.edu.vn`), Supabase sẽ gửi thư kích hoạt và **chặn đăng nhập cho đến khi bấm link xác nhận email**. Vì học sinh không có hòm thư thực tế, cần phải bật auto-confirm trong Dashboard hoặc quản trị viên tạo tài khoản xác nhận sẵn.
- **Tài khoản người dùng trong `auth.users`:** Quyền `anon` không được phép đọc danh mục `auth.users`. Cần xác minh số lượng tài khoản qua Dashboard.

