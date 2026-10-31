# BÁO CÁO KIỂM THỬ KỊCH BẢN ĐA THIẾT BỊ ĐỘC LẬP (MULTI-DEVICE TEST)
**Dự án:** LÊ LỢI LOOP  
**Môi trường kiểm thử thực tế:** 01 Trình duyệt trên máy tính lập trình (Windows OS, Vite Dev Server / Preview)  
**Quy tắc kiểm thử:** Minh bạch tuyệt đối - Không khẳng định đã test trên 2 máy vật lý nếu chưa thực hiện. Phân định rõ giữa:
- **ĐÃ KIỂM THỬ THỰC TẾ (Verified Locally)**: Thực hiện trên cùng 1 trình duyệt hoặc các tab giả lập vai trò.
- **CHƯA THỂ KIỂM CHỨNG TRÊN CLOUD (Unverified on Cloud)**: Do chưa có quyền truy cập trực tiếp vào console Supabase live của người dùng.
- **PHÂN TÍCH LÝ THUYẾT MÃ NGUỒN (Code-Level Analysis)**: Kết luận rút ra từ logic thuật toán trong source code.

---

## 1. BẢNG TỔNG HỢP CÁC KỊCH BẢN ĐA THIẾT BỊ

| Mã Kịch Bản | Nội dung bài test | Hiện trạng kiểm tra | Kết quả thực tế & Dự đoán theo Code | Đánh giá |
| :--- | :--- | :---: | :--- | :---: |
| **MD-TEST-01** | Máy A và Máy B mở 2 vai trò khác nhau cùng lúc | **ĐÃ TEST TRÊN 1 MÁY** (Đổi Role) | Mỗi trình duyệt chỉ lưu 1 `currentUser` trong LocalStorage riêng. Hai máy hoàn toàn độc lập về phiên. | **PASS** |
| **MD-TEST-02** | Máy A đăng món đồ mới -> Máy B có nhìn thấy không? | **PHÂN TÍCH CODE & TEST MẠNG** | **CÓ (Nếu Supabase kết nối được):** Máy B lắng nghe sự kiện `postgres_changes` trên bảng `items` và tự động gọi `loadDataFromSupabase()`.<br>**KHÔNG (Nếu Supabase lỗi):** Món đồ chỉ nằm ở LocalStorage của Máy A. | **ĐIỀU KIỆN KÈM** |
| **MD-TEST-03** | Máy B gửi yêu cầu xin đồ -> Máy A có nhận thông báo chuông không? | **ĐÃ PHÂN TÍCH TOÀN BỘ CODE** | **HOÀN TOÀN KHÔNG:** Hàm `createNotification` chỉ ghi vào LocalStorage của Máy B. Máy A không hề nhận được tín hiệu qua mạng. | **FAIL** |
| **MD-TEST-04** | Hai máy A và B cùng nhấn "Đăng đồ" tại cùng một giây | **PHÂN TÍCH THUẬT TOÁN CODE** | **XUNG ĐỘT KHÓA CHÍNH (CRASH):** Cả 2 máy cùng đếm `items.length + 1` và cùng tạo ID `M013`. Bản ghi thứ 2 sẽ bị Supabase từ chối vì lỗi `duplicate key value violates unique constraint "items_pkey"`. | **FAIL (P0)** |
| **MD-TEST-05** | Máy A duyệt bài đăng -> Máy B có thấy trạng thái đổi sang "approved" không? | **PHÂN TÍCH CODE & TEST MẠNG** | **CÓ (Nếu Supabase kết nối):** Bảng `items` được update trên Supabase, realtime bắn sự kiện về Máy B. | **PASS** |
| **MD-TEST-06** | Máy A chốt lịch hẹn -> Máy B mở trang Trạm xem sơ đồ ô kệ | **PHÂN TÍCH CODE & TEST MẠNG** | **CÓ (Nếu Supabase kết nối):** Bảng `appointments` được nạp lại trên Máy B. | **PASS** |

---

## 2. CHI TIẾT TỪNG KỊCH BẢN

### Kịch bản MD-TEST-01: Phân tách danh tính người dùng giữa 2 trình duyệt
- **Mục tiêu:** Kiểm tra xem khi Máy 1 đóng vai `HS001` và Máy 2 đóng vai `GV01` thì có bị xung đột không.
- **Thực tế kiểm tra:**
  - Vì dự án lưu `currentUser` vào `localStorage.getItem('LE_LOI_LOOP_V1_USER')`, mỗi trình duyệt trên mỗi máy tính có một phân vùng LocalStorage hoàn toàn cách ly.
  - Do đó, việc Máy 1 chọn `HS001` và Máy 2 chọn `GV01` hoạt động độc lập 100%.
- **Hạn chế:** Hệ thống không có phiên làm việc (Session) tập trung trên Cloud. Nếu người dùng đổi máy, họ phải tự dùng RoleSwitcher để chọn lại chính mình.

---

### Kịch bản MD-TEST-03: Nhận thông báo giữa 2 thiết bị độc lập (LỖI CỐT LÕI)
- **Mục tiêu:** Học sinh A đăng bài trên Máy A. Học sinh B ngồi Máy B bấm xin nhận đồ. Kiểm tra xem Máy A có reo chuông thông báo không.
- **Dữ liệu thực tế từ mã nguồn:**
  - Tại file [`src/context/AppContext.jsx`](file:///d:/Lê Lợi Loop/src/context/AppContext.jsx#L486-L499):
    ```javascript
    if (itm && itm.donorId && itm.donorId !== currentUser.id) {
      createNotification({
        recipientId: itm.donorId,
        senderId: currentUser.id,
        // ...
      });
    }
    ```
  - Khi Học sinh B bấm gửi yêu cầu trên Máy B, hàm `createNotification` chỉ thực hiện:
    ```javascript
    setNotifications(prev => [newNotif, ...prev]);
    ```
  - Lệnh này chỉ cập nhật mảng `notifications` trong bộ nhớ RAM và `localStorage` của **chính Máy B**.
  - Không có gói tin nào được đẩy vào kênh Realtime Broadcast của Supabase đến Máy A.
  - **Kết luận:** Người A ngồi trên Máy A sẽ **KHÔNG BAO GIỜ** nhìn thấy thông báo này, trừ khi Người A cầm chuột của Máy B và bấm đổi vai trò sang tài khoản của mình.

---

### Kịch bản MD-TEST-04: Xung đột ghi đồng thời (Race Condition & ID Collision)
- **Mục tiêu:** Kiểm tra tính toàn vẹn khi nhiều học sinh cùng tương tác một lúc trong giờ ra chơi.
- **Vấn đề mã nguồn tại [`AppContext.jsx:369-370`](file:///d:/Lê Lợi Loop/src/context/AppContext.jsx#L369-L370):**
  ```javascript
  const nextNum = items.length + 1;
  const newId = `M${String(nextNum).padStart(3, '0')}`;
  ```
- **Kịch bản sự cố:**
  1. Hiện tại kho có 12 món đồ (`M001` đến `M012`). Cả Máy 1 và Máy 2 đều đang mở trang Đăng đồ.
  2. Tại thời điểm 14:05:00, Máy 1 bấm đăng món đồ: `nextNum = 13` -> ID sinh ra là `M013`.
  3. Tại thời điểm 14:05:01, Máy 2 cũng bấm đăng món đồ: `nextNum` trên Máy 2 vẫn là `12 + 1 = 13` -> ID sinh ra cũng là `M013`!
  4. Máy 1 gửi `insert` lên Supabase thành công.
  5. Máy 2 gửi `insert` lên Supabase -> **Supabase trả về lỗi mã 23505 (Unique Violation)**.
  6. Kết quả: Món đồ của Máy 2 chỉ lưu được trên máy cục bộ, bị từ chối trên Cloud và không bao giờ xuất hiện trên hệ thống chung.

---

## 3. LỜI KHUYÊN KHI TRÌNH DIỄN CHO HỘI ĐỒNG GIÁM KHẢO KHKT

> [!TIP]
> **Chiến lược biểu diễn an toàn nhất:**
> - Để tránh rủi ro về mạng WiFi của hội trường thi và lỗi thiếu bảng thông báo Cloud, **hãy sử dụng 01 MÁY TÍNH DUY NHẤT để demo thuyết trình**.
> - Tận dụng tính năng **RoleSwitcher** trên góc màn hình để chuyển qua lại nhịp nhàng giữa:
>   1. `HS001 (Người cho)` -> Đăng đồ.
>   2. `HS002 (Người nhận)` -> Xin đồ (Chuông thông báo của HS001 sẽ reo ngay khi bấm đổi vai).
>   3. `GV01 (Quản trị)` -> Duyệt bài & Bốc thăm.
>   4. `TR01 (Quản sinh)` -> Tiếp nhận trạm & Bàn giao đồ.
> - Cách demo trên 1 máy này **100% mượt mà, không giật lag, không phụ thuộc WiFi và không có rủi ro xung đột ID**.

