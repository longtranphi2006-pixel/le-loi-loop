# LÊ LỢI LOOP – HỆ THỐNG GHÉP NỐI & ĐIỀU PHỐI TRAO NHẬN ĐỒ DÙNG HỌC TẬP

> **Khẩu hiệu dự án:** *"Đồ cũ trao tay – Giá trị ở lại"*  
> **Đề tài Nghiên cứu Khoa học Kỹ thuật (KHKT) cấp THCS**  
> **Đơn vị thực hiện:** Trường THCS Lê Lợi, Quận Hải Châu, TP. Đà Nẵng  

---

## 1. Giới thiệu Đề tài
Dự án **Lê Lợi Loop** giải quyết triệt để nút thắt lệch ca học (Sáng vs Chiều) và sự thiếu công bằng, lãng phí thời gian trong việc trao đổi sách vở, dụng cụ học tập và đồng phục cũ giữa học sinh THCS.

Hệ thống kết hợp giữa **Nền tảng Web SPA**, **Thuật toán điều phối tối ưu đa mục tiêu LoopMatch**, **Trạm lưu trữ trung chuyển 10 ô kệ (K1-A1 đến K1-B5)** và quy trình song hành **Phiếu giấy** dành cho các bạn không có điện thoại thông minh.

---

## 2. Tech Stack & Kiến trúc
- **Frontend SPA:** React 18 + Vite
- **Styling:** Tailwind CSS (Màu chủ đạo: Emerald Green `#15803D`, Amber `#D97706`, Nền kem `#FDFBF7`, Xám trung tính)
- **Icons:** `lucide-react`
- **Lưu trữ:** `localStorage` với Schema quản lý tập trung và chức năng *Khôi phục dữ liệu demo*.
- **Hoạt động độc lập (Client-side):** Không cần server backend ngoài, dễ dàng triển khai và chấm thi KHKT trên bất kỳ máy tính nào.

---

## 3. Cấu trúc 10 Trang & Phân hệ Nghiệp vụ
1. **Role Switcher & Topbar Banner:** Thanh nổi chuyển đổi 4 vai diễn (HS001 - Trần Bảo An học sáng, HS002 - Lê Hoàng Nam học chiều, TR01 - Đội trực trạm CLB, GV01 - Thầy Nguyễn Văn A) + Nút khôi phục dữ liệu ban đầu.
2. **Trang 1 – Trang chủ:** Hero section, thống kê mô phỏng (128 món đăng, 96 món đã trao, 74 học sinh, 1 trạm), danh mục nhanh, quy trình 4 bước và hướng dẫn đăng ký phiếu giấy tại trường.
3. **Trang 2 – Kho đồ:** Bộ lọc từ khóa, danh mục, tình trạng (Như mới, Tốt, Đã dùng), trạng thái (Mở / Đóng).
4. **Trang 3 – Chi tiết món đồ:** Xem hình ảnh, mô tả, kiểm tra chất lượng thực tế, nút gửi yêu cầu (tự động khóa nếu là chủ món, đã nhận hoặc tạm đóng).
5. **Trang 4 – Đăng đồ:** Form đăng ký tặng đồ, hỗ trợ ảnh minh họa, chọn ca rảnh gửi đồ, phân loại web/phiếu giấy. Món đồ mới sẽ vào trạng thái *Chờ duyệt*, không tự ý hiển thị trên Kho đồ.
6. **Trang 5 – Gửi yêu cầu nhận:** Nhập lý do, chọn các ca rảnh đến trạm, lưu trạng thái *Chờ xét* minh bạch.
7. **Trang 6 – Hoạt động của tôi:** 3 Tab (Món đã đăng, Yêu cầu nhận, Lịch hẹn & Mã nhận đồ / Thẻ QR minh họa).
8. **Trang 7 – Trạm Lê Lợi Loop:** Trực quan hóa 2 mô hình (Trao trực tiếp & Lưu tạm thời), sơ đồ tương tác 10 ô kệ K1 (K1-A1 đến K1-B5), danh sách hiện vật đang lưu trạm.
9. **Trang 8 – Bảng điều khiển Quản lý:** 6 Tab chuyên trách:
   - **Tab A:** Duyệt bài đăng (Duyệt / Từ chối kèm lý do / Yêu cầu bổ sung).
   - **Tab B:** Xét chọn người nhận & Bốc thăm ngẫu nhiên với Fixed Seed.
   - **Tab C:** Điều phối lịch trao nhận tích hợp LoopMatch.
   - **Tab D:** Tiếp nhận & Kiểm tra thực tế tại trạm, gán ô kệ K1.
   - **Tab E:** Bàn giao đồ, đối chiếu mã nhận và vô hiệu hóa mã sau khi nhận.
   - **Tab F:** Nhật ký hệ thống (Audit log ghi lại thời gian, hành động, vai trò).
10. **Trang 9 – Thuật toán Điều phối LoopMatch:**
   - Input: Ca người cho + Ca người nhận + Lịch trực trạm + Sức chứa (10 ô) + Thời hạn lưu (&le; 3 ngày).
   - 3 bước logic: Tìm ca trùng &rarr; Kiểm tra điều kiện biên &rarr; Xếp hạng tối ưu.
   - Bộ giải thuật tương tác thời gian thực (< 0.01s).
11. **Trang 10 – Phòng thí nghiệm LoopMatch (Dành cho Báo cáo KHKT):**
   - 4 kịch bản mẫu đối chứng (Trùng ca, Lệch ca hợp lệ, Quá tải sức chứa, Vi phạm thời gian lưu).
   - Bảng so sánh khoa học đối chứng giữa Điều phối thủ công vs LoopMatch tự động.
   - Nút **Xuất báo cáo CSV** chứa đầy đủ thông số đầu vào và kết quả kiểm thử.

---

## 4. Hướng dẫn Chạy ứng dụng

### Chạy chế độ phát triển (Development):
```bash
npm run dev
```
Mở trình duyệt tại địa chỉ hiển thị trên terminal (thường là `http://localhost:3000` hoặc `http://localhost:5173`).

### Đóng gói dự án (Production Build):
```bash
npm run build
npm run preview
```

