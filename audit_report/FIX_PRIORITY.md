# KẾ HOẠCH VÀ THỨ TỰ ƯU TIÊN KHẮC PHỤC (FIX PRIORITY)
**Dự án:** LÊ LỢI LOOP - THCS Lê Lợi  
**Mục tiêu:** Tối ưu hóa hệ thống để đạt điểm tối đa trong buổi thuyết trình và chấm thi KHKT.  

---

## 1. DANH SÁCH BẮT BUỘC PHẢI XỬ LÝ TRƯỚC BUỔI CHẤM THI KHKT (TIÊU CHUẨN P0 & P1)

### 📌 Việc 1: Thêm bộ lọc Ô Kệ Trống khi Tiếp nhận đồ tại Trạm (P1)
- **Mức độ rủi ro:** Ban giám khảo yêu cầu thử nghiệm tiếp nhận 2 món đồ liên tiếp vào cùng 1 ô kệ -> hệ thống bị đè dữ liệu.
- **File cần chỉnh:** `src/pages/AdminDashboardPage.jsx` (dòng 709).
- **Giải pháp code:**
  Chỉ hiển thị các ô kệ chưa bị chiếm dụng:
  ```jsx
  {STORAGE_SLOTS.map(slot => {
    const isOccupied = occupiedSlots.includes(slot);
    return (
      <option key={slot} value={slot} disabled={isOccupied}>
        {slot} {isOccupied ? '(Đã có đồ - Đang khóa)' : '(Trống - Sẵn sàng)'}
      </option>
    );
  })}
  ```
- **Thời gian ước tính:** 5 phút.

---

### 📌 Việc 2: Bảo vệ Route Quản trị `/admin` bằng ProtectedRoute (P0)
- **Mức độ rủi ro:** Giám khảo hỏi: *"Nếu học sinh biết link /admin thì sao?"* -> Nếu học sinh vào được sẽ bị trừ điểm bảo mật và phân quyền.
- **File cần chỉnh:** Tạo component `src/components/ProtectedRoute.jsx` và bọc route trong `src/App.jsx`.
- **Giải pháp code:**
  ```jsx
  // src/components/ProtectedRoute.jsx
  import { Navigate } from 'react-router-dom';
  import { useApp } from '../context/AppContext';

  export default function ProtectedRoute({ children, allowedRoles }) {
    const { currentUser } = useApp();
    if (!allowedRoles.includes(currentUser.role)) {
      return <Navigate to="/" replace />;
    }
    return children;
  }
  ```
  Trong `src/App.jsx`:
  ```jsx
  <Route 
    path="/admin" 
    element={
      <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
        <AdminDashboardPage />
      </ProtectedRoute>
    } 
  />
  ```
- **Thời gian ước tính:** 10 phút.

---

### 📌 Việc 3: Bổ sung Bảng `notifications` vào Database Supabase (P0)
- **Mục tiêu:** Đảm bảo khi người dùng thao tác thật trên Supabase, dữ liệu thông báo giữa các máy tính khác nhau được đồng bộ qua Cloud.
- **File cần chỉnh:** `supabase_schema.sql`.
- **Giải pháp SQL:**
  Chạy lệnh sau trong Supabase SQL Editor:
  ```sql
  CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Allow public all notifications" ON public.notifications;
  CREATE POLICY "Allow public all notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
  ```
- **Thời gian ước tính:** 5 phút.

---

### 📌 Việc 4: Bổ sung Giao diện Đổi lịch hẹn trên Admin Dashboard (P1)
- **Mục tiêu:** Hoàn thiện nốt 100% tính năng đổi lịch khi học sinh bận đột xuất.
- **File cần chỉnh:** `src/pages/AdminDashboardPage.jsx`.
- **Giải pháp:** Thêm nút *"Đổi lịch"* trong danh sách lịch hẹn để gọi hàm `rescheduleAppointment(appointmentId, newSlot, reason)`.
- **Thời gian ước tính:** 15 phút.

---

## 2. NHỮNG TÍNH NĂNG ĐỂ DÀNH PHÁT TRIỂN SAU CUỘC THI (POST-DEMO BACKLOG - P2)

Những tính năng này mang tính hoàn thiện ứng dụng doanh nghiệp, **không ảnh hưởng đến luồng thuyết trình KHKT**:

1. **Hệ thống Supabase Auth thật với Email và Mật khẩu:**
   - Trong cuộc thi: Dùng `RoleSwitcher` tiện lợi hơn gấp 10 lần vì giám khảo không phải gõ tài khoản/mật khẩu nhiều lần khi muốn xem các góc nhìn khác nhau.
2. **Tải ảnh thật lên Supabase Storage:**
   - Hiện tại chọn ảnh mẫu hoặc dán link ảnh trực tuyến đã hoàn toàn đáp ứng mặt thị giác.
3. **Chức năng Hủy / Chỉnh sửa bài đăng của học sinh:**
   - Học sinh có thể liên hệ trực tiếp Quản sinh hoặc Admin xóa trong trang quản trị nếu cần.

---

## 3. QUY TRÌNH KIỂM TRA LẠI (RE-TEST PROCEDURE)

Sau khi tiến hành sửa các mục ở Phần 1, hãy thực hiện theo đúng 5 bước sau để đảm bảo hệ thống hoàn hảo:

1. **Kiểm tra Route Guard:**
   - Chuyển sang `HS001 (Trần Minh Đức)`.
   - Gõ trực tiếp `http://localhost:5173/admin` vào URL.
   - **Kỳ vọng:** Trình duyệt tự động nhảy về trang chủ `/`, không mở trang quản trị.

2. **Kiểm tra Chống trùng ô kệ Trạm:**
   - Cho `HS001` mang đồ đến trạm bàn giao.
   - Quản sinh tiếp nhận và cất vào ô `K1-A1`.
   - Tiếp tục tiếp nhận món đồ thứ 2.
   - Mở dropdown ô lưu trữ -> **Kỳ vọng:** Ô `K1-A1` bị mờ (`disabled`) và có chữ *(Đã có đồ)*, không cho chọn lại.

3. **Kiểm tra Build Vite:**
   - Chạy lệnh trong terminal:
     ```powershell
     npm run build
     ```
   - **Kỳ vọng:** Build thành công, mã thoát code `0`, không có lỗi cú pháp hoặc import thiếu.

4. **Kịch bản Demo chuẩn cho 5 phút thuyết trình KHKT:**
   - **Bước 1 (1 phút):** Đóng vai `HS001` đăng bộ sách cũ lên hệ thống kèm chọn lịch rảnh.
   - **Bước 2 (1 phút):** Đóng vai `HS002` vào xem chi tiết và bấm xin đồ kèm lịch rảnh cá nhân.
   - **Bước 3 (1 phút):** Đóng vai `GV01` (Thầy Tổng phụ trách) duyệt bài và bấm Bốc thăm LCG công bằng.
   - **Bước 4 (1 phút):** Hệ thống LoopMatch tự động ghép lịch đưa đồ về Phòng Đội (Phân hiệu THCS Lê Lợi).
   - **Bước 5 (1 phút):** Đóng vai `TR01` (Quản sinh trạm) kiểm tra đồ, cất vào kệ `K1-A1`, sau đó học sinh đến đọc mã `LOOP-xxxx` và hoàn tất chu trình tuần hoàn.

