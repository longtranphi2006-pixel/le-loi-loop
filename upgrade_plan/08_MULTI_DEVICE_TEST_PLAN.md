# 08_MULTI_DEVICE_TEST_PLAN.md: KẾ HOẠCH KIỂM THỬ ĐA THIẾT BỊ ĐỘC LẬP (3–5 THIẾT BỊ)
**Dự án:** LÊ LỢI LOOP  
**Mục tiêu:** Kiểm chứng toàn diện khả năng vận hành đồng bộ Cloud trên 3–5 thiết bị thật với 10–30 tài khoản thử nghiệm trong 48 giờ.  
**Trạng thái:** KẾ HOẠCH CHUẨN BỊ - SẼ THỰC HIỆN SAU KHI HOÀN TẤT GIAI ĐOẠN MIGRATION.  

---

## 1. PHÂN BỔ THIẾT BỊ VÀ TÀI KHOẢN THỬ NGHIỆM

### A. Danh sách 5 thiết bị thử nghiệm vật lý:
1. **Thiết bị 1 (Laptop Giáo viên / Admin):** MacBook / Windows Laptop - Google Chrome (Vai trò `GV01`).
2. **Thiết bị 2 (Điện thoại Học sinh Cho):** iPhone / iOS Safari (Vai trò `HS001`).
3. **Thiết bị 3 (Điện thoại Học sinh Nhận A):** Android / Samsung Chrome (Vai trò `HS002`).
4. **Thiết bị 4 (Điện thoại Học sinh Nhận B):** Android / Xiaomi Chrome (Vai trò `HS003` - Để test bốc thăm và cạnh tranh).
5. **Thiết bị 5 (Máy tính bảng / Laptop Trạm Phòng Đội):** iPad / Laptop bàn trực (Vai trò `TR01`).

### B. Danh mục tài khoản thử nghiệm (Pilot Account Pool):
- **Cán bộ quản trị:** `gv01@leloiloop.local` (Thầy Nguyễn Văn A - Phụ trách KHKT).
- **Quản sinh Trạm:** `tr01@leloiloop.local`, `tr02@leloiloop.local` (CLB Tình nguyện Phòng Đội).
- **Học sinh thử nghiệm (10 bạn):**
  - `hs001@leloiloop.local` (Trần Bảo An - 7/1)
  - `hs002@leloiloop.local` (Lê Hoàng Nam - 8/2)
  - `hs003@leloiloop.local` (Nguyễn Thảo Nhi - 7/4)
  - `hs004@leloiloop.local` (Võ Minh Khang - 6/3)
  - `hs005@leloiloop.local` đến `hs010@leloiloop.local` (Dự phòng cho test tải đồng thời).
- **Mật khẩu chung cho đợt pilot:** `LeLoiLoop@2026`.

---

## 2. MA TRẬN 10 KỊCH BẢN KIỂM THỬ TRỌNG YẾU (CORE TEST SCENARIOS)

| Mã Test | Tên Kịch Bản | Thiết bị tham gia | Quy trình thực hiện | Tiêu chí nghiệm thu (PASS Criteria) |
| :--- | :--- | :--- | :--- | :--- |
| **MDT-01** | **Đăng đồ & Realtime Kho đồ** | TB2 (`HS001`) -> TB1 (`GV01`) & TB3 (`HS002`) | TB2 đăng món "Bộ Compa KHKT". TB1 và TB3 đang mở màn hình. | • TB1 thấy xuất hiện trong Tab Phê duyệt trong $\le 1$ giây.<br>• Sau khi TB1 duyệt, TB3 thấy trên Kho đồ ngay lập tức mà không cần F5. |
| **MDT-02** | **Nhiều học sinh cùng xin 1 món** | TB3 (`HS002`) & TB4 (`HS003`) -> TB2 (`HS001`) | Cả 2 học sinh cùng gửi yêu cầu xin nhận món đồ trên. | • TB2 (Người cho) thấy danh sách có 2 ứng viên.<br>• Số lượng badge yêu cầu tăng chính xác lên 2. |
| **MDT-03** | **Chuông thông báo liên máy** | TB3 (`HS002`) -> TB2 (`HS001`) | TB3 bấm gửi yêu cầu. | • Biểu tượng chuông trên TB2 reo đỏ kèm popup thông báo trong $\le 0.5$ giây. |
| **MDT-04** | **Chống gửi Duplicate Request** | TB3 (`HS002`) | Mở 2 tab trên cùng điện thoại, cố tình bấm gửi 2 lần cho cùng 1 món đồ. | • Yêu cầu 1 thành công.<br>• Yêu cầu 2 bị Database từ chối (lỗi 23505), hiện cảnh báo: "Bạn đã gửi yêu cầu trước đó rồi". |
| **MDT-05** | **Người cho chọn người nhận qua RPC** | TB2 (`HS001`) -> TB3 (`HS002`) & TB4 (`HS003`) | TB2 chọn trao đồ cho TB3. | • TB3 nhận thông báo: "Yêu cầu được chấp thuận!".<br>• TB4 tự động chuyển trạng thái sang dự phòng (`backup`). |
| **MDT-06** | **Chống Race Condition ô kệ trạm** | TB5 (`TR01`) & TB1 (`GV01`) | Cả 2 cán bộ cùng mở modal tiếp nhận và cùng bấm gán vào ô `K1-A1` trong cùng 1 giây. | • Người bấm trước gán thành công vào ô `K1-A1`.<br>• Người bấm sau nhận thông báo lỗi từ RPC: "Ô kệ K1-A1 hiện đã có đồ lưu trữ! Vui lòng chọn ô khác". |
| **MDT-07** | **Bàn giao và Vô hiệu hóa mã 4 số** | TB3 (`HS002`) & TB5 (`TR01`) | Học sinh đọc mã `LOOP-xxxx`. Quản sinh nhập mã xác nhận bàn giao trên TB5. | • Bàn giao thành công, ô kệ được giải phóng.<br>• Nếu nhập lại mã đó lần thứ 2, hệ thống từ chối: "Mã nhận đồ này đã được sử dụng trước đó". |
| **MDT-08** | **Bảo lưu dữ liệu sau khi F5** | Tất cả thiết bị | Nhấn F5 tải lại trang. | • Dữ liệu hiển thị đúng 100% theo Cloud, không bị giật lùi về trạng thái cũ. |
| **MDT-09** | **Cảnh báo lỗi mất mạng (Cloud Fallback)** | TB2 (`HS001`) | Tắt kết nối WiFi/4G trên TB2 và thử thao tác đăng đồ. | • Hiện banner đỏ cảnh báo mất kết nối Cloud.<br>• Không báo thành công giả tạo. |
| **MDT-10** | **Chặn truy cập trái phép Quản trị** | TB3 (`HS002`) | Học sinh gõ trực tiếp URL `.../admin`. | • `ProtectedRoute` chặn lại ngay lập tức và điều hướng về trang chủ. |

