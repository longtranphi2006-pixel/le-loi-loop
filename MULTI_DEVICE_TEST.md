# KỊCH BẢN VÀ KẾ HOẠCH KIỂM THỬ ĐA THIẾT BỊ ĐỘC LẬP (MULTI-DEVICE TEST)
**Dự án:** LÊ LỢI LOOP  
**Mục tiêu:** Kiểm thử thực tế trên 2–3 thiết bị độc lập (Ví dụ: Laptop Giáo viên, Điện thoại Học sinh 1, Điện thoại Học sinh 2) trong 48 giờ thử nghiệm.  
**Branch:** `fix/cloud-multi-user-pilot`  

---

## 1. THIẾT LẬP MÔI TRƯỜNG KIỂM THỬ ĐA THIẾT BỊ

Để tiến hành kiểm thử 2–3 thiết bị độc lập mà không cần deploy production:
1. **Thiết bị A (Máy chủ phát Dev):** Máy tính chạy lệnh:
   ```powershell
   npm run dev -- --host
   ```
   Ghi lại địa chỉ IP mạng nội bộ (ví dụ: `http://192.168.1.15:5173`).
2. **Thiết bị B (Điện thoại hoặc Laptop thứ 2):** Kết nối cùng mạng WiFi, mở trình duyệt truy cập `http://192.168.1.15:5173`.
3. **Thiết bị C (Tab ẩn danh hoặc Thiết bị thứ 3):** Truy cập cùng địa chỉ trên.

---

## 2. BẢNG MA TRẬN KỊCH BẢN KIỂM THỬ ĐA THIẾT BỊ

| Mã Kịch Bản | Tên Kịch Bản | Vai trò Thiết bị 1 | Vai trò Thiết bị 2 | Kỳ vọng hệ thống | Trạng thái hiện tại |
| :--- | :--- | :---: | :---: | :--- | :---: |
| **MDT-01** | **HS001 đăng món đồ mới** | `HS001` (Đăng đồ) | `GV01` (Mở trang Quản trị) | Khi Thiết bị 1 bấm Đăng, tab Quản lý trên Thiết bị 2 tự động hiện món mới trong danh sách Chờ duyệt mà không cần F5. | Sẵn sàng test sau migration |
| **MDT-02** | **GV01 duyệt bài đăng** | `GV01` (Bấm Duyệt) | `HS002` (Mở Kho đồ) | Món đồ chuyển từ `pending` sang `approved`. Thiết bị 2 thấy món đồ xuất hiện trên Kho đồ ngay lập tức. | Sẵn sàng test sau migration |
| **MDT-03** | **HS002 gửi yêu cầu xin đồ** | `HS002` (Bấm Xin nhận) | `HS001` (Người cho) | Thiết bị 1 (của HS001) nhận chuông thông báo Cloud và hiện popup: *"Lê Hoàng Nam vừa gửi yêu cầu xin đồ của bạn"*. | **Cần migration notifications** |
| **MDT-04** | **Chống gửi Duplicate Request** | `HS002` (Gửi lần 1) | `HS002` (Cố tình gửi lần 2 qua tab khác) | Database kích hoạt chỉ mục `uq_requests_item_requester`, từ chối bản ghi trùng lặp và thông báo: *"Bạn đã gửi yêu cầu cho món này rồi"*. | **Cần migration constraints** |
| **MDT-05** | **Hai máy cùng đăng đồ đồng thời (Concurrent Item Creation)** | `HS001` (Bấm Đăng) | `HS002` (Bấm Đăng cùng giây) | Cả 2 máy sinh ID ngẫu nhiên phân tán `M-xxxxx`, không bị lỗi trùng khóa chính `items_pkey`. Cả 2 món đều được lưu thành công. | Sẵn sàng trên branch này |
| **MDT-06** | **HS001 đồng ý trao đồ (Accept Request)** | `HS001` (Đồng ý) | `HS002` (Người nhận) | Giao dịch nguyên tử qua RPC: request thành `selected`, món đồ thành `matching`, Thiết bị 2 nhận thông báo chúc mừng qua Cloud. | **Cần migration RPC** |
| **MDT-07** | **Hai quản sinh cùng gán 1 ô kệ trạm (Concurrent Storage Slot Claim)** | Quản sinh 1 (Gán ô K1-A1) | Quản sinh 2 (Gán ô K1-A1) | Giao dịch nguyên tử qua RPC hoặc Unique index: Máy 1 gán thành công, Máy 2 nhận thông báo lỗi: *"Ô K1-A1 đã có đồ lưu trữ, vui lòng chọn ô khác"*. | **Cần migration RPC** |
| **MDT-08** | **Xác nhận bàn giao & Chống bàn giao 2 lần** | Quản sinh (Nhập mã LOOP-xxxx) | Quản sinh 2 (Cố tình nhập lại mã đó) | Lần 1: Bàn giao thành công, giải phóng ô kệ. Lần 2: Hệ thống báo: *"Mã nhận đồ này ĐÃ ĐƯỢC BÀN GIAO trước đó và đã bị vô hiệu hóa an toàn"*. | Sẵn sàng trên branch này |
| **MDT-09** | **Tải lại trang (Reload Persistence)** | Bất kỳ thiết bị nào | Nhấn F5 tải lại trang | Dữ liệu được nạp chính xác từ Cloud Supabase, không bị mất hoặc biến dạng dữ liệu. | Sẵn sàng trên branch này |
| **MDT-10** | **Ứng xử khi mất kết nối Cloud (Cloud Failure)** | Tắt WiFi trên Thiết bị 1 | Thao tác trên app | Giao diện hiện banner màu đỏ/cam: `Cloud Sync Error / Offline Mode`, không báo thành công giả tạo, lưu bản nháp an toàn vào LocalStorage. | Sẵn sàng trên branch này |
| **MDT-11** | **Chặn truy cập trái phép `/admin` (Unauthorized Route)** | `HS001` (Học sinh) | Gõ URL `/admin` | `ProtectedRoute` phát hiện vai trò học sinh, lập tức điều hướng về trang chủ `/`, từ chối mở trang quản trị. | Sẵn sàng trên branch này |
| **MDT-12** | **Chặn ghi trái phép vào Database (Unauthorized DB Write)** | Client `anon` gửi lệnh DELETE items | Supabase Database | RLS từ chối yêu cầu, dữ liệu của học sinh không bị kẻ xấu xóa sạch. | **Cần migration RLS** |

---

## 3. BIÊN BẢN HƯỚNG DẪN THỰC HIỆN KIỂM THỬ THỰC TẾ

Khi nhóm tác giả thực hiện kiểm thử trên 2 thiết bị thực tế tại trường, hãy ghi chép nhật ký theo mẫu sau:

```markdown
### Nhật ký Kiểm thử Thực tế:
- Ngày/Giờ: ...
- Thiết bị A: [Laptop Lenovo Windows 11 - Chrome 129]
- Thiết bị B: [Điện thoại iPhone 13 - Safari 18]
- Kết quả MDT-01 (Đăng đồ sang máy kia): [ĐẠT / CHƯA ĐẠT] - Độ trễ: ... giây
- Kết quả MDT-03 (Chuông thông báo liên máy): [ĐẠT / CHƯA ĐẠT] - Độ trễ: ... giây
- Kết quả MDT-05 (Đăng đồng thời 2 máy): [ĐẠT / CHƯA ĐẠT] - ID máy 1: ..., ID máy 2: ...
- Chữ ký người kiểm tra: ...
```
