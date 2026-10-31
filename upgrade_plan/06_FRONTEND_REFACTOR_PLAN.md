# 06_FRONTEND_REFACTOR_PLAN.md: KẾ HOẠCH TÁI CẤU TRÚC FRONTEND (STAGE 2 PREPARATION)
**Dự án:** LÊ LỢI LOOP  
**Mục tiêu:** Chuẩn bị kế hoạch chi tiết để chuyển đổi frontend từ LocalStorage-first sang Pure Cloud Source of Truth trong Giai đoạn 2.  
**Nguyên tắc an toàn:** Chưa chỉnh sửa mã nguồn frontend trong lần này.  

---

## 1. CÁC ĐIỂM CẦN TÁI CẤU TRÚC TRONG `AppContext.jsx`

### A. Xóa bỏ State khởi tạo từ LocalStorage (No LocalStorage-First)
- **Hiện tại:**
  ```javascript
  const [items, setItems] = useState(() => localStorage.getItem(KEYS.ITEMS) || INITIAL_ITEMS);
  ```
  *Hậu quả:* Giao diện hiển thị dữ liệu bộ nhớ đệm cũ hoặc dữ liệu mẫu tĩnh trước khi dữ liệu Cloud được tải về, gây sai lệch khi thử nghiệm đa thiết bị.
- **Kế hoạch Giai đoạn 2:**
  ```javascript
  const [items, setItems] = useState([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  ```
  Ứng dụng hiển thị Skeleton Loading cho đến khi `loadDataFromSupabase()` hoàn tất.

### B. Xóa bỏ `useEffect` ghi đè LocalStorage đồng bộ
- **Hiện tại:** `useEffect` lắng nghe `[currentUser, items, requests, appointments, logs, notifications]` và chạy `localStorage.setItem` liên tục.
- **Kế hoạch Giai đoạn 2:** Bỏ `useEffect` này. Dữ liệu chỉ được cập nhật trên React State và Cloud Database. LocalStorage chỉ dùng lưu `auth_token` qua Supabase Client.

### C. Nâng cấp xử lý thông báo (`notifications`)
- Khi bảng `notifications` được tạo trên Supabase:
  - Hàm `createNotification` chỉ đẩy lên Supabase qua RPC hoặc insert.
  - State `notifications` được cập nhật tự động qua kênh `supabase_realtime` lắng nghe sự kiện `INSERT` trên bảng `notifications`.
  - Xóa bỏ việc lưu mảng thông báo vào LocalStorage.

---

## 2. KẾ HOẠCH NÂNG CẤP XÁC THỰC (AUTH MODAL & ROLE SWITCHER)

1. **Thay thế RoleSwitcher bằng AuthSessionBar:**
   - Tạo component `AuthModal.jsx`: Cho phép nhập Email (`hs001@leloiloop.local`) + Mật khẩu.
   - Thêm nút *"Đăng nhập nhanh tài khoản thử nghiệm KHKT"* cho 4 vai trò chính:
     - `[Đăng nhập HS001 - Trần Bảo An]`
     - `[Đăng nhập HS002 - Lê Hoàng Nam]`
     - `[Đăng nhập GV01 - Thầy Nguyễn Văn A]`
     - `[Đăng nhập TR01 - Quản sinh Phòng Đội]`
   - Mỗi nút bấm sẽ thực thi hàm thật:
     ```javascript
     await supabase.auth.signInWithPassword({
       email: 'hs001@leloiloop.local',
       password: 'LeLoiLoop@2026'
     });
     ```
2. **Lắng nghe phiên đăng nhập qua `onAuthStateChange`:**
   ```javascript
   useEffect(() => {
     const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
       if (session?.user) {
         // Lấy thông tin profile từ database
         const { data: profile } = await supabase.from('profiles').select('*').eq('auth_user_id', session.user.id).single();
         setCurrentUser(profile);
       } else {
         setCurrentUser(null);
       }
     });
     return () => subscription.unsubscribe();
   }, []);
   ```

---

## 3. LỘ TRÌNH KIỂM CHỨNG VÀ BẢO ĐẢM TƯƠNG THÍCH

1. **Khả năng tương thích ngược (Backward Compatibility):**
   - Trong quá trình nâng cấp, nếu chưa có session Auth (người dùng chưa đăng nhập), hệ thống hiển thị nút đăng nhập rõ ràng thay vì tự gán mặc định `HS001`.
2. **Xử lý lỗi mạng:**
   - Nếu mất mạng, hiển thị component `OfflineBanner.jsx` có nút *"Thử kết nối lại"* thay vì âm thầm hoạt động giả định.

