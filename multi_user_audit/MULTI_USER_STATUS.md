# BÁO CÁO ĐÁNH GIÁ ĐỒNG BỘ ĐA NGƯỜI DÙNG & KIẾN TRÚC DỮ LIỆU
**Dự án:** LÊ LỢI LOOP - Nền tảng tuần hoàn đồ dùng học tập THCS Lê Lợi  
**Người thực hiện:** Senior QA Engineer & Full-stack Architect  
**Ngày kiểm định:** 30/10/2026  
**Phạm vi kiểm tra:** Cơ chế lưu trữ dữ liệu, kiến trúc đồng bộ Client - Cloud, tính năng Realtime, phân quyền dữ liệu giữa nhiều thiết bị độc lập.

---

## 1. KẾT LUẬN DUY NHẤT VÀ CHÍNH XÁC NHẤT

> [!IMPORTANT]
> **KẾT LUẬN KIẾN TRÚC HỆ THỐNG:**  
> Hệ thống **LÊ LỢI LOOP** hiện tại là **MÔ HÌNH LAI (HYBRID) GIỮA LOCALSTORAGE VÀ SUPABASE CLOUD**, trong đó:
> 1. **Tầng lõi vận hành thực tế tại Client:** 100% dựa vào **LocalStorage và State bộ nhớ** (sử dụng cơ chế giả lập chuyển vai `RoleSwitcher` trên cùng một trình duyệt).
> 2. **Tầng Supabase Cloud:** Đã được cài đặt mã nguồn kết nối (CRUD và Realtime listener cho `items`, `requests`, `appointments`, `logs`), **nhưng chưa phải là một hệ thống Cloud đa người dùng thực thụ** vì:
>    - Hoàn toàn **không dùng Supabase Auth** (không có token JWT, không phân biệt session giữa các máy).
>    - Thuật toán sinh khóa chính tự tăng theo độ dài mảng (`items.length + 1` => `M013`) chắc chắn sẽ gây **xung đột khóa chính (Primary Key Collision)** nếu 2 thiết bị cùng đăng đồ cùng lúc.
>    - Hệ thống **Thông báo (Notifications)** 100% chỉ chạy cục bộ trong LocalStorage của một máy duy nhất, **không thể đồng bộ sang máy khác**.
>    - Nếu cơ sở dữ liệu Supabase bị lỗi (hoặc chưa chạy lệnh SQL hoàn chỉnh), ứng dụng **âm thầm nuốt lỗi và chạy 100% trên LocalStorage** mà người dùng không hề hay biết.

---

## 2. PHÂN TÍCH CHI TIẾT CƠ CHẾ LƯU TRỮ VÀ VẬN HÀNH

### A. Khởi tạo dữ liệu khi mở ứng dụng / Tải lại trang (F5)
Quy trình nạp dữ liệu trong [`src/context/AppContext.jsx`](file:///d:/Lê Lợi Loop/src/context/AppContext.jsx#L42-L101):
1. **Bước 1 (Đồng bộ - Synchronous):**
   - React khởi tạo state ban đầu bằng cách đọc trực tiếp từ `localStorage`:
     - `LE_LOI_LOOP_V1_USER` -> Nếu rỗng lấy `USERS[0]` (`HS001`).
     - `LE_LOI_LOOP_V1_ITEMS` -> Nếu rỗng lấy `INITIAL_ITEMS` (`seedData.js`).
     - `LE_LOI_LOOP_V1_REQUESTS` -> Nếu rỗng lấy `INITIAL_REQUESTS`.
     - `LE_LOI_LOOP_V1_APPOINTMENTS` -> Nếu rỗng lấy `INITIAL_APPOINTMENTS`.
     - `LE_LOI_LOOP_V1_LOGS` -> Nếu rỗng lấy `INITIAL_LOGS`.
     - `LE_LOI_LOOP_V1_NOTIFICATIONS` -> Nếu rỗng lấy `INITIAL_NOTIFICATIONS`.
   - Kết quả: Ứng dụng hiển thị ngay lập tức dữ liệu từ LocalStorage của máy đó.

2. **Bước 2 (Bất đồng bộ - Asynchronous qua `useEffect`):**
   - Gọi hàm `loadDataFromSupabase()`:
     - Gửi 4 truy vấn song song qua Supabase client: `items.select()`, `requests.select()`, `appointments.select()`, `logs.select()`.
     - **Nếu có kết nối mạng và Supabase trả về dữ liệu ($> 0$ bản ghi):** Ghi đè vào React state, kích hoạt `useEffect` lưu đè lại vào `localStorage` của máy đó.
     - **Nếu Supabase bị lỗi (lỗi mạng, sai key, bảng chưa tạo):** Rơi vào khối `catch`, ghi log cảnh báo ra console và **tiếp tục giữ nguyên dữ liệu trong LocalStorage**.
     - **Nếu bảng Supabase rỗng (0 bản ghi):** Code kiểm tra `if (itemsRes.data.length > 0)` -> Do mảng rỗng nên **bỏ qua không cập nhật state**, ứng dụng tiếp tục dùng dữ liệu mẫu từ `seedData`/`localStorage`!

---

## 3. MA TRẬN ĐỒNG BỘ DỮ LIỆU ĐA NGƯỜI DÙNG

| Tiêu chí kiểm tra | Đang chạy trên LocalStorage | Đang chạy trên Supabase | Đánh giá thực tế khi dùng 2 trình duyệt độc lập |
| :--- | :---: | :---: | :--- |
| **Đăng nhập / Danh tính** | Có (RoleSwitcher) | **Không** | **Không độc lập:** Mỗi máy tự chọn vai trò độc lập, không biết máy kia là ai. |
| **Đăng món đồ mới (`addItem`)** | Có | Có (`insert`) | **Một chiều / Trễ:** Máy A đăng -> lên Cloud -> Máy B nghe Realtime để tải lại. Nhưng nếu 2 máy cùng đăng sẽ gãy ID `M...`. |
| **Duyệt bài đăng (`approveItem`)** | Có | Có (`update`) | Đồng bộ được nếu Supabase Realtime hoạt động. |
| **Gửi yêu cầu xin đồ (`addRequest`)** | Có | Có (`insert`) | Gửi được lên bảng `requests` trên Cloud. |
| **Thông báo tương tác (Notifications)** | **Có** | **KHÔNG** | **HOÀN TOÀN KHÔNG ĐỒNG BỘ:** Thông báo của Máy A chỉ lưu trên ổ cứng Máy A. Máy B không thể nhận được chuông thông báo. |
| **Tiếp nhận & Lưu kho Trạm** | Có | Có (`update`) | Đồng bộ được trạng thái kệ nếu kết nối Cloud thông suốt. |
| **Bàn giao đồ & Đổi lịch** | Có | Có (`update`) | Đồng bộ được trạng thái hoàn tất giao dịch. |

---

## 4. KẾT QUẢ RÀ SOÁT TÌNH TRẠNG KẾT NỐI SUPABASE THỰC TẾ

1. **Thông tin cấu hình `.env`:**
   - Đã khai báo `VITE_SUPABASE_URL=https://vepuogmvrnhpwneufjff.supabase.co`.
   - Đã khai báo `VITE_SUPABASE_ANON_KEY` (JWT Role: anon).
2. **Bằng chứng thực thi Database:**
   - Dựa trên ảnh chụp màn hình do người dùng cung cấp (`media_1793200794005_d13e0113.png`), trong lần chạy script SQL gần nhất trên giao diện Supabase Dashboard, hệ thống báo lỗi:
     ```
     Error: Failed to run sql query: ERROR: 42710: policy "Allow public read users" for table "users" already exists
     ```
   - **Ý nghĩa kỹ thuật:** Câu lệnh SQL bị dừng đột ngột tại dòng 100 khi gặp lỗi trùng policy. Do đó, các bảng hoặc dữ liệu mẫu ở các dòng phía sau (đặc biệt là dữ liệu mẫu của `requests`, `appointments`, `logs`) **chưa được khởi tạo trọn vẹn trong Database Supabase của dự án**.
3. **Cơ chế Fallback bảo vệ Demo:**
   - Nhờ có cơ chế Fallback thông minh tại [`src/context/AppContext.jsx:176`](file:///d:/Lê Lợi Loop/src/context/AppContext.jsx#L176), website không bị sập màn hình trắng mà âm thầm chuyển sang chạy 100% bằng dữ liệu mẫu LocalStorage. Đây là ưu điểm giúp demo an toàn, nhưng gây hiểu nhầm rằng hệ thống đang lưu trên Cloud.

