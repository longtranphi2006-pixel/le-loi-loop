# KỊCH BẢN KIỂM THỬ THỰC TẾ (TEST CASES) - HỆ THỐNG LÊ LỢI LOOP
**Dự án:** LÊ LỢI LOOP - Tuần hoàn đồ dùng học tập THCS Lê Lợi  
**Người thực hiện kiểm thử:** Senior QA Engineer  
**Bộ kịch bản:** End-to-End, Logic Algorithm, Data Flow, Security & Edge Cases  

---

## BẢNG TỔNG HỢP TEST CASES

| Mã Test Case | Tên Kịch Bản | Mức Độ | Kết Quả |
| :--- | :--- | :---: | :---: |
| **TC-AUTH-01** | Chuyển đổi vai trò người dùng (RoleSwitcher) | P0 | **PASS** |
| **TC-AUTH-02** | Truy cập trái phép trang Quản trị (`/admin`) | P0 | **FAIL** |
| **TC-ITEM-01** | Đăng món đồ học tập mới với đầy đủ thông tin | P0 | **PASS** |
| **TC-ITEM-02** | Kiểm tra chặn gửi form khi thiếu trường bắt buộc | P1 | **PASS** |
| **TC-ITEM-03** | Tìm kiếm và lọc danh mục đồ dùng theo tình trạng | P1 | **PASS** |
| **TC-REQ-01** | Gửi yêu cầu xin nhận đồ dùng học tập | P0 | **PASS** |
| **TC-REQ-02** | Ngăn chặn học sinh gửi yêu cầu trùng lặp trên cùng món đồ | P1 | **PASS** |
| **TC-REQ-03** | Bốc thăm ngẫu nhiên minh bạch khi nhiều người cùng xin | P0 | **PASS** |
| **TC-REQ-04** | Người Cho trực tiếp phê duyệt Người Nhận từ trang cá nhân | P0 | **PASS** |
| **TC-MATCH-01** | LoopMatch tìm khung giờ trực tiếp khi lịch rảnh trùng khớp | P0 | **PASS** |
| **TC-MATCH-02** | LoopMatch tự động chọn phương án qua Trạm Phòng Đội | P0 | **PASS** |
| **TC-MATCH-03** | Phát hiện và loại bỏ phương án vi phạm nghịch lý thời gian | P1 | **PASS** |
| **TC-STATION-01**| Quản sinh tiếp nhận đồ tại Phòng Đội và gán ô kệ lưu trữ | P0 | **PASS** |
| **TC-STATION-02**| Xác minh mã 4 số và hoàn tất bàn giao cho học sinh nhận | P0 | **PASS** |
| **TC-NOTIF-01** | Thông báo tức thì khi Người B nhận được yêu cầu từ Người A | P0 | **PASS** |
| **TC-DB-01** | Khả năng tự phục hồi (Offline Fallback) khi mất mạng/Supabase | P0 | **PASS** |

---

## CHI TIẾT TỪNG TEST CASE

### TC-AUTH-01: Chuyển đổi vai trò người dùng (RoleSwitcher)
- **Mục tiêu:** Kiểm tra khả năng đóng vai nhanh các đối tượng để biểu diễn quy trình trước ban giám khảo.
- **Các bước thực hiện:**
  1. Nhìn lên góc trên thanh Navbar (hoặc thanh Switcher góc phải).
  2. Chọn `GV01 (Thầy Nguyễn Văn A - Quản trị)`.
  3. Quan sát giao diện và menu.
  4. Chọn lại `HS001 (Trần Minh Đức)`.
- **Kết quả mong đợi:** Giao diện lập tức chuyển đổi ngữ cảnh, hiển thị đúng vai trò và danh sách bài đăng/yêu cầu tương ứng của người đó.
- **Kết quả thực tế:** Hệ thống cập nhật `currentUser` ngay lập tức, thanh Navbar đổi sang danh mục phù hợp.
- **Đánh giá:** **PASS**

---

### TC-AUTH-02: Truy cập trái phép trang Quản trị (`/admin`)
- **Mục tiêu:** Kiểm tra việc bảo vệ trang quản trị khi học sinh cố tình nhập đường dẫn.
- **Các bước thực hiện:**
  1. Đang ở vai trò `HS001 (Học sinh lớp 9/1)`.
  2. Nhập thủ công lên thanh địa chỉ trình duyệt: `http://localhost:5173/admin`.
  3. Nhấn Enter.
- **Kết quả mong đợi:** Hệ thống phải chặn và chuyển hướng (redirect) về trang chủ hoặc thông báo *"Bạn không có quyền truy cập"*.
- **Kết quả thực tế:** Giao diện trang Quản trị vẫn mở ra bình thường, học sinh có thể bấm duyệt đồ và bốc thăm.
- **Đánh giá:** **FAIL (Mức độ P0)**

---

### TC-ITEM-01: Đăng món đồ học tập mới với đầy đủ thông tin
- **Mục tiêu:** Kiểm tra chức năng chia sẻ đồ dùng học tập của học sinh.
- **Các bước thực hiện:**
  1. Chọn vai trò `HS001`.
  2. Truy cập trang `/donate` (Đăng đồ).
  3. Nhập tiêu đề: *"Bộ Compa và Thước kẻ Parabol"*.
  4. Chọn môn: *"Toán"*, Tình trạng: *"Còn rất mới (95%)"*.
  5. Chọn khung giờ rảnh: *"Thứ 2 - Chiều"*, *"Thứ 4 - Sáng"*.
  6. Bấm *"Đăng món đồ"*.
- **Kết quả mong đợi:** Có thông báo thành công, món đồ xuất hiện trong danh sách cá nhân với trạng thái *"Chờ duyệt"* (`pending`).
- **Kết quả thực tế:** Toast thông báo hiển thị, dữ liệu được ghi vào `items` state, xuất hiện trong Tab Phê duyệt của Admin.
- **Đánh giá:** **PASS**

---

### TC-ITEM-02: Kiểm tra chặn gửi form khi thiếu trường bắt buộc
- **Mục tiêu:** Đảm bảo không có bài đăng rác hoặc thiếu thông tin thời gian rảnh.
- **Các bước thực hiện:**
  1. Vào `/donate`.
  2. Bỏ trống ô *"Tên món đồ"*.
  3. Bấm *"Đăng món đồ"*.
- **Kết quả mong đợi:** Form kích hoạt validation của HTML5 hoặc báo lỗi yêu cầu nhập đầy đủ.
- **Kết quả thực tế:** Trình duyệt hiện tooltip thông báo trường bắt buộc nhập `required`.
- **Đánh giá:** **PASS**

---

### TC-REQ-01: Gửi yêu cầu xin nhận đồ dùng học tập
- **Mục tiêu:** Học sinh A gửi yêu cầu nhận đồ từ bài đăng của Học sinh B.
- **Các bước thực hiện:**
  1. Đóng vai `HS002 (Lê Hoàng Nam)`.
  2. Vào Danh mục `/catalog`, chọn món *"Bộ Sách Giáo Khoa Toán 7"* của `HS001`.
  3. Bấm xem chi tiết `/items/M001`.
  4. Chọn khung giờ rảnh của bản thân: *"Thứ 2 - Chiều"*, nhập lời nhắn: *"Em xin cho em gái học lớp 7"*.
  5. Bấm *"Gửi yêu cầu nhận món này"*.
- **Kết quả mong đợi:** Nút chuyển sang trạng thái *"Đã gửi yêu cầu"*, hệ thống tạo bản ghi trong bảng `requests`.
- **Kết quả thực tế:** Request được tạo chính xác với trạng thái `pending`, nút bị disable để tránh gửi trùng.
- **Đánh giá:** **PASS**

---

### TC-REQ-03: Bốc thăm ngẫu nhiên minh bạch khi nhiều người cùng xin (LCG Lottery)
- **Mục tiêu:** Kiểm tra tính khách quan khi có nhiều bạn học sinh cùng muốn nhận 1 món đồ.
- **Các bước thực hiện:**
  1. Chọn vai trò `GV01` (Quản trị).
  2. Vào trang `/admin`, chọn Tab B *"Xử lý Yêu cầu"*.
  3. Tìm món đồ có từ 2 yêu cầu trở lên.
  4. Bấm nút *"Bốc thăm ngẫu nhiên công bằng (LCG)"*.
- **Kết quả mong đợi:** Hệ thống chạy thuật toán Linear Congruential Generator, chọn ra đúng 1 bạn trúng thăm, các bạn còn lại chuyển thành `rejected` có lý do tử tế, hiển thị thông báo kết quả.
- **Kết quả thực tế:** Kết quả hiển thị rõ ràng bạn trúng thăm kèm tỷ lệ xác suất, ghi log kiểm toán đầy đủ.
- **Đánh giá:** **PASS**

---

### TC-MATCH-01: LoopMatch tìm khung giờ trực tiếp khi lịch rảnh trùng khớp
- **Mục tiêu:** Kiểm tra thuật toán ghép lịch giao dịch trực tiếp giữa 2 học sinh.
- **Các bước thực hiện:**
  - Người Cho rảnh: `T2_PM`, `T4_AM`.
  - Người Nhận rảnh: `T2_PM`, `T5_PM`.
  - Khung giờ trực Trạm: `T2_PM` đang mở ca trực.
  - Kích hoạt thuật toán ghép lịch trong `loopMatchAlgorithm.js`.
- **Kết quả mong đợi:** Thuật toán đề xuất phương thức `direct` với khung giờ vàng `T2_PM`.
- **Kết quả thực tế:** `loopMatchAlgorithm` trả về match type `direct`, slot `T2_PM`, độ trễ 0 ngày.
- **Đánh giá:** **PASS**

---

### TC-MATCH-03: Phát hiện và loại bỏ phương án vi phạm nghịch lý thời gian
- **Mục tiêu:** Đảm bảo Người Cho luôn phải gửi đồ trước khi Người Nhận đến nhận.
- **Các bước thực hiện:**
  - Giả lập Người Cho chỉ rảnh `T5_PM` (Thứ 5 chiều).
  - Người Nhận muốn nhận vào `T2_AM` (Thứ 2 sáng).
- **Kết quả mong đợi:** Thuật toán phải loại bỏ phương án này với mã lỗi `TIME_PARADOX`.
- **Kết quả thực tế:** Hàm kiểm tra `donorSlotIndex < requesterSlotIndex` trả về false và ghi nhận `rejectionReasons: ['TIME_PARADOX']`.
- **Đánh giá:** **PASS**

---

### TC-STATION-01: Quản sinh tiếp nhận đồ tại Phòng Đội và gán ô kệ lưu trữ
- **Mục tiêu:** Mô phỏng quy trình thực tế người cho mang đồ đến trạm bàn giao.
- **Các bước thực hiện:**
  1. Đóng vai `TR01` (CLB Tình nguyện - Quản sinh trạm).
  2. Vào `/admin` Tab D *"Tiếp nhận tại Trạm"*.
  3. Bấm *"Tiếp nhận đồ"* cho lịch hẹn đang chờ.
  4. Đánh dấu checkbox *"Đã kiểm tra chất lượng đạt quy định"*.
  5. Chọn ô kệ còn trống (ví dụ: `K1-A1`).
  6. Bấm *"Xác nhận tiếp nhận và Lưu kho"*.
- **Kết quả mong đợi:** Món đồ chuyển trạng thái `in_station`, ô kệ `K1-A1` trên bản đồ Trạm chuyển màu vàng (Đang lưu đồ), tự động sinh mã nhận 4 số gửi cho người nhận.
- **Kết quả thực tế:** Mọi thao tác diễn ra chính xác theo quy trình.
- **Đánh giá:** **PASS**

---

### TC-STATION-02: Xác minh mã 4 số và hoàn tất bàn giao cho học sinh nhận
- **Mục tiêu:** Người nhận đến đọc mã, quản sinh đối chiếu và giao đồ.
- **Các bước thực hiện:**
  1. Người nhận cung cấp mã (ví dụ: `LOOP-4821`).
  2. Quản sinh vào Tab E *"Bàn giao đồ"*, nhập mã xác nhận.
  3. Bấm *"Xác nhận bàn giao thành công"*.
- **Kết quả mong đợi:** Hệ thống xác nhận thành công, giải phóng ô kệ về màu xanh (Trống), vô hiệu hóa mã nhận, chuyển trạng thái giao dịch sang `completed`.
- **Kết quả thực tế:** Toàn bộ dữ liệu được cập nhật chuẩn xác, ghi log hoàn tất chu trình tuần hoàn.
- **Đánh giá:** **PASS**

---

### TC-NOTIF-01: Thông báo tức thì khi Người B nhận được yêu cầu từ Người A
- **Mục tiêu:** Kiểm tra phản hồi thông báo khi có tương tác giữa 2 học sinh.
- **Các bước thực hiện:**
  1. `HS002` gửi yêu cầu nhận đồ của `HS001`.
  2. Chuyển sang vai trò `HS001`.
  3. Nhìn vào biểu tượng chuông trên thanh Navbar.
- **Kết quả mong đợi:** Chuông hiển thị chấm đỏ (badge số 1), bấm vào chuông thấy dòng thông báo: *"Lê Hoàng Nam đã gửi yêu cầu nhận món đồ của bạn"*.
- **Kết quả thực tế:** Thông báo hiển thị ngay lập tức không cần tải lại trang.
- **Đánh giá:** **PASS**

---

### TC-DB-01: Khả năng tự phục hồi (Offline Fallback) khi mất mạng/Supabase
- **Mục tiêu:** Đảm bảo bài thuyết trình trước ban giám khảo không bao giờ bị gián đoạn do sự cố mạng.
- **Các bước thực hiện:**
  1. Tắt kết nối WiFi hoặc cấu hình URL Supabase sai.
  2. Tải lại trang (F5).
- **Kết quả mong đợi:** Website vẫn hoạt động bình thường, tự động lấy dữ liệu từ LocalStorage hoặc bộ dữ liệu hạt giống `seedData.js`.
- **Kết quả thực tế:** Website hiển thị toast thông báo chế độ Demo Offline và nạp đầy đủ dữ liệu mượt mà, không gặp lỗi màn hình trắng.
- **Đánh giá:** **PASS**

