# DANH SÁCH TẬP TIN THỰC SỰ THAY ĐỔI — GIAI ĐOẠN 2B
**Dự án:** LÊ LỢI LOOP  
**Branch:** `feat/phase2-cloud-pilot`  
**Ngày cập nhật:** 30/10/2026  

---

## 1. TỔNG HỢP CÁC TẬP TIN ĐÃ TẠO VÀ CHỈNH SỬA

| Tập tin | Loại thay đổi | Mục đích kỹ thuật |
| :--- | :---: | :--- |
| `src/context/AppContext.jsx` | SỬA LỚN (REFACTOR) | Chuyển đổi toàn bộ sang Cloud-First, xóa bỏ fallback đa bảng bẩn, kiểm tra `error` trên mọi mutation, ánh xạ profile qua bảng `profiles`, đồng bộ `markNotificationAsRead` lên Cloud. |
| `src/components/AuthModal.jsx` | TẠO MỚI & SỬA BẢO MẬT | Modal đăng nhập Supabase Auth dành cho lứa tuổi THCS; xóa bỏ hardcode password và email giả định; hướng dẫn 4 vai trò rõ ràng. |
| `src/components/RoleSwitcher.jsx` | SỬA BẢO MẬT | Khóa nút chuyển vai trò tự do khi kết nối Cloud, khóa nút reset/seed DB, hiển thị trạng thái phiên đăng nhập an toàn. |
| `src/components/Navbar.jsx` | SỬA | Tích hợp nút Đăng nhập / Đăng xuất, chuông thông báo Realtime, hiển thị trạng thái Auth. |
| `src/components/ProtectedRoute.jsx` | SỬA | Bảo vệ trang `/admin` và `/station` theo vai trò được chứng thực, chặn học sinh truy cập trái phép. |
| `src/lib/supabase.js` | SỬA | Tối ưu hóa hàm `genUniqueId` lên 16 hex characters (~1.8e19 entropy) chống đụng độ; hỗ trợ đọc biến môi trường an toàn cả trong Node và Vite. |
| `src/utils/loopMatchAlgorithm.js` | SỬA | Chuẩn hóa import `seedData.js` theo chuẩn ECMAScript Modules (ESM). |
| `src/App.jsx` | SỬA | Tích hợp `AuthModal`, cập nhật thông điệp bản quyền Cloud Pilot ở Footer. |
| `scripts/verify_phase2b_tests.js` | TẠO MỚI | Test runner tự động kiểm tra 17 assertions cho các thuật toán lõi (LoopMatch, LCG, Capacity, Collision, Format). |
| `upgrade_plan/migrations/005_auth_rls_DRAFT_ONLY.sql` | CẬP NHẬT | Thiết kế bảng `profiles`, trigger `trg_prevent_role_tampering`, hàm `get_current_profile()` và 3 RPC bảo mật nguyên tử lấy danh tính từ `auth.uid()`. |

---

## 2. CHI TIẾT CÁC HÀM ĐÃ THAY ĐỔI TRONG `AppContext.jsx`

### A. Hàm `resolveUserProfile(user)`
- **Cũ:** So sánh chuỗi email bắt đầu bằng `u.id` (`hs001@...`).
- **Mới:** Truy vấn bảng `public.profiles` theo `auth_user_id = user.id`. Nếu có, lấy `legacy_user_id`, `role`, `full_name`. Nếu chưa có bảng profiles, tra cứu `user_metadata` hoặc bảng `users`.

### B. Hàm `switchRole(userId)`
- **Cũ:** Cho phép bất kỳ ai bấm nút để chuyển thành bất kỳ vai trò nào (kể cả Giáo viên `GV01`).
- **Mới:** Khi kết nối Cloud Supabase, chặn chuyển vai trò tự do. Yêu cầu đăng xuất và đăng nhập bằng tài khoản tương ứng qua `AuthModal`.

### C. Hàm `addItem(itemData)`
- **Cũ:** `setItems(prev => [newItem, ...prev])` trước khi gọi Supabase. Nếu Supabase lỗi, món đồ vẫn nằm trong React state và localStorage.
- **Mới:** Gửi `supabase.from('items').insert` trước. Nếu có lỗi, bật `sync_error`, báo lỗi rõ ràng, KHÔNG thêm vào state. Chỉ thêm vào state sau khi database xác nhận thành công.

### D. Hàm `approveItem(itemId)`
- **Cũ:** Cập nhật state ngay lập tức, không kiểm tra quyền người gọi, không kiểm tra phản hồi lỗi từ Supabase.
- **Mới:** Kiểm tra quyền `currentUser.role` (bắt buộc là `teacher`, `station_staff`, `admin`). Gửi lệnh cập nhật lên Supabase trước. Nếu lỗi, dừng lại. Nếu thành công mới cập nhật giao diện.

### E. Hàm `rejectItem(itemId, reason)` và `requestItemUpdate(itemId, note)`
- **Cũ:** Cập nhật state trước, nuốt lỗi Supabase.
- **Mới:** Kiểm tra quyền, cập nhật Cloud trước, kiểm tra `error`, chỉ đổi state khi database thành công.

### F. Hàm `addRequest(itemId, reason, availableSlots, inputMethod)`
- **Cũ:** Cập nhật state trước, không kiểm tra người đăng tự xin đồ của mình.
- **Mới:** 
  - Kiểm tra `itm.donorId === currentUser.id`: Từ chối ngay nếu tự xin đồ của chính mình.
  - Gửi `supabase.from('requests').insert` trước. Bắt mã lỗi Postgres `23505` (Unique Violation) để báo thông tin chống trùng lặp.
  - Chỉ thêm vào state và gửi chuông thông báo sau khi database ghi nhận thành công.

### G. Hàm `acceptRequestByDonor(requestId)`
- **Cũ:** Cập nhật state trước. Nếu RPC lỗi, âm thầm chạy `Promise.all` cập nhật nhiều bảng rời rạc không có giao dịch ACID.
- **Mới:** 
  - Xác minh quyền: Phải là chính người đăng món đồ (`donorId`) hoặc Giáo viên/Admin.
  - Gọi Stored Procedure RPC `rpc_accept_request_by_donor`.
  - Nếu RPC lỗi: Báo lỗi chi tiết, dừng thao tác, KHÔNG fallback sang cập nhật nhiều bảng dở dang.
  - Chỉ cập nhật state khi RPC trả về kết quả thành công.

### H. Hàm `inspectAndReceiveItem({ aptId, passed, note, storageSlot })`
- **Cũ:** Cập nhật state trước. Nếu RPC lỗi, chạy fallback `Promise.all` rời rạc.
- **Mới:** 
  - Xác minh quyền Quản sinh Trạm / Giáo viên.
  - Gọi RPC `rpc_inspect_and_receive_item`.
  - Nếu RPC lỗi: Dừng lại và thông báo lỗi. Xóa bỏ hoàn toàn fallback không an toàn.

### I. Hàm `completeHandover(enteredCode)`
- **Cũ:** Cập nhật state trước. Nếu RPC lỗi, chạy fallback `Promise.all` rời rạc.
- **Mới:** 
  - Xác minh quyền Quản sinh Trạm / Giáo viên.
  - Kiểm tra mã nhận đã `completed` chưa.
  - Gọi RPC `rpc_complete_handover`.
  - Nếu RPC lỗi: Báo lỗi và không thay đổi giao diện.

### J. Hàm `markNotificationAsRead(id)` & `markAllNotificationsAsRead()`
- **Cũ:** Chỉ cập nhật React state trong bộ nhớ, không gửi lệnh cập nhật lên Supabase.
- **Mới:** Đồng thời cập nhật React state VÀ gửi lệnh `UPDATE public.notifications SET is_read = true` lên Cloud.

