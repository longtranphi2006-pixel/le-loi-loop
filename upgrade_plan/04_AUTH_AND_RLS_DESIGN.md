# 04_AUTH_AND_RLS_DESIGN.md: THIẾT KẾ XÁC THỰC & BẢO MẬT PHÂN QUYỀN (DRAFT DESIGN)
**Dự án:** LÊ LỢI LOOP  
**Mục tiêu:** Thiết kế mô hình Auth và Row Level Security (RLS) an toàn cho 10–30 tài khoản thử nghiệm trên 3–5 thiết bị.  
**Trạng thái:** TÀI LIỆU THIẾT KẾ THAM CHIẾU - CHƯA ÁP DỤNG LÊN DATABASE LIVE.  

---

## 1. MÔ HÌNH QUAN HỆ THỰC THỂ AUTH & PROFILE

```
+--------------------------------------------------------------+
|                      auth.users (UUID)                       |
|   (id, email, encrypted_password, email_confirmed_at, ...)  |
+--------------------------------------------------------------+
                               |
                               | (1 - 1 via auth_user_id)
                               v
+--------------------------------------------------------------+
|                   public.profiles (Table)                    |
|   - id: UUID PRIMARY KEY DEFAULT gen_random_uuid()           |
|   - auth_user_id: UUID UNIQUE REFERENCES auth.users(id)      |
|   - legacy_user_id: TEXT UNIQUE (ví dụ: 'HS001', 'GV01')     |
|   - full_name: TEXT NOT NULL                                 |
|   - role: TEXT ('student', 'station_staff', 'teacher')       |
|   - class: TEXT ('7/1', '8/2')                               |
|   - shift: TEXT ('Sáng', 'Chiều')                            |
+--------------------------------------------------------------+
                               |
         +---------------------+---------------------+
         | (1 - n)                                   | (1 - n)
         v                                           v
+-------------------------------+   +-------------------------------+
|         public.items          |   |        public.requests        |
| - donor_id -> legacy_user_id  |   | - requester_id -> legacy_id   |
+-------------------------------+   +-------------------------------+
         |                                           |
         +---------------------+---------------------+
                               v
+-------------------------------+   +-------------------------------+
|     public.appointments       |   |     public.notifications      |
| - donor_id, requester_id      |   | - recipient_id -> legacy_id   |
+-------------------------------+   +-------------------------------+
```

---

## 2. GIẢI PHÁP ĐĂNG NHẬP KHÔNG PHỤ THUỘC VÀO EMAIL TRƯỜNG THỰC TẾ

> [!IMPORTANT]
> **Thực tế:** Trường THCS Lê Lợi và học sinh cấp 2 **không có hệ thống hòm thư điện tử riêng (`@thcsleloi.edu.vn`)**. Học sinh cũng không sử dụng email cá nhân để nhận link xác nhận.

### Giải pháp thiết kế:
1. **Quy ước định danh tài khoản Pilot (Synthetic Email Mapping):**
   - Học sinh lớp 7/1 mã số 01: `hs001@leloiloop.local` (Mật khẩu mặc định: `LeLoiLoop@2026`).
   - Quản sinh CLB Tình nguyện: `tr01@leloiloop.local`.
   - Giáo viên phụ trách KHKT: `gv01@leloiloop.local`.
2. **Yêu cầu cấu hình trên Supabase Dashboard:**
   - Vào menu: **Authentication** -> **Providers** -> **Email**.
   - **Tắt tùy chọn "Confirm email"** (Chuyển `mailer_autoconfirm` sang `true`).
   - Việc này cho phép tài khoản sau khi tạo qua API hoặc script có thể đăng nhập ngay mà không bị chặn bởi bước xác thực hòm thư ảo.

---

## 3. LỘ TRÌNH CHUYỂN ĐỔI DẦN TỪ ROLE SWITCHER SANG AUTH THỰC

### Giai đoạn thử nghiệm Pilot (Dual-Mode):
- Hệ thống hỗ trợ song song 2 cách đăng nhập:
  1. **Đăng nhập thật:** Form nhập Email (`hs001@leloiloop.local`) + Mật khẩu -> Supabase cấp token JWT hợp lệ.
  2. **Nút chuyển nhanh (Quick Pilot Selector):** Nút bấm gọi thẳng hàm `supabase.auth.signInWithPassword({ email: '...', password: '...' })` thay vì chỉ đổi biến local.
- Khi người dùng đăng nhập thành công, context lấy `auth.uid()`, tìm trong bảng `profiles` để gắn `currentUser` với đầy đủ quyền hạn.

---

## 4. MA TRẬN CHÍNH SÁCH ROW LEVEL SECURITY (RLS) MỤC TIÊU

| Bảng dữ liệu | Thao tác (Action) | Quyền hạn cho phép (Policy Logic) |
| :--- | :---: | :--- |
| **`items`** | `SELECT` | • Mọi người dùng đã đăng nhập (hoặc anon) được xem các món có `status = 'approved'`.<br>• Người đăng (`donor_id = auth.uid()`) được xem món đồ của mình dù đang `pending` hoặc `needs_update`.<br>• Giáo viên / Quản sinh được xem toàn bộ món đồ. |
| **`items`** | `INSERT` | • Học sinh đăng nhập được tạo món đồ mới với `donor_id = auth.uid()`. |
| **`items`** | `UPDATE` | • Người đăng chỉ được sửa bài của mình khi ở trạng thái `pending` hoặc `needs_update`.<br>• Giáo viên/Quản sinh được duyệt hoặc đổi trạng thái lưu kệ. |
| **`requests`** | `SELECT` | • Học sinh chỉ được xem các request do chính mình tạo (`requester_id = auth.uid()`).<br>• Người cho (`donor_id`) được xem các request xin đồ của mình.<br>• Quản trị viên được xem danh sách để bốc thăm. |
| **`requests`** | `INSERT` | • Chỉ học sinh đăng nhập mới được gửi request xin đồ.<br>• Không được tự gửi request cho món đồ do chính mình đăng (`requester_id != item.donor_id`). |
| **`appointments`** | `SELECT` | • Học sinh chỉ thấy lịch hẹn mà mình là Người Cho hoặc Người Nhận.<br>• **Mã nhận đồ 4 số (`pickup_code`) chỉ hiển thị cho Người Nhận** và Quản sinh trạm; Người Cho không xem được mã này. |
| **`notifications`** | `SELECT` / `UPDATE` | • **CHỈ NGƯỜI NHẬN (`recipient_id = auth.uid()`)** mới có quyền đọc và đánh dấu đã đọc. Tuyệt đối không cho phép truy vấn chéo. |

