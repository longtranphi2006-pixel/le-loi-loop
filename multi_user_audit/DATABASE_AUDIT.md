# KIỂM ĐỊNH CHI TIẾT CƠ SỞ DỮ LIỆU & CHÍNH SÁCH BẢO MẬT (DATABASE AUDIT)
**Dự án:** LÊ LỢI LOOP  
**Hệ quản trị:** PostgreSQL trên nền tảng Supabase Cloud  
**File lược đồ:** [`supabase_schema.sql`](file:///d:/Lê Lợi Loop/supabase_schema.sql)  

---

## 1. ĐỐI CHIẾU DANH SÁCH BẢNG: CODE THỰC TẾ VỚI SQL SCHEMA

| Tên Bảng | Được khai báo trong SQL? | Code frontend có gọi truy vấn? | Các thao tác được gọi trong Code | Tình trạng & Đánh giá |
| :--- | :---: | :---: | :---: | :--- |
| **`users`** | **CÓ** (Dòng 8-19) | Có (Chỉ khi nạp Seed) | `upsert` | **Khuyết chức năng đọc:** Frontend không bao giờ gọi `supabase.from('users').select()`. Toàn bộ dữ liệu user vẫn lấy từ file cứng `src/data/seedData.js`. |
| **`items`** | **CÓ** (Dòng 22-40) | Có (Thường xuyên) | `select`, `insert`, `update` | Đồng bộ đầy đủ các trường, cấu trúc JSONB cho `available_slots` và `quality_check` chuẩn xác. |
| **`requests`** | **CÓ** (Dòng 43-56) | Có (Thường xuyên) | `select`, `insert`, `update` | Đồng bộ đầy đủ các trường giữa CamelCase và Snake_case. |
| **`appointments`** | **CÓ** (Dòng 58-74) | Có (Thường xuyên) | `select`, `insert`, `update` | Đầy đủ trường mã nhận `pickup_code`, trạng thái lưu kệ. |
| **`logs`** | **CÓ** (Dòng 77-84) | Có (Thường xuyên) | `select`, `insert` | Nhật ký ghi nhận tốt các hành động kiểm toán KHKT. |
| **`notifications`** | ❌ **CHƯA CÓ TRONG SQL** | **CÓ GỌI INSERT** ([dòng 337](file:///d:/Lê Lợi Loop/src/context/AppContext.jsx#L337)) | `insert` (Bị lỗi và nuốt ngoại lệ) | **LỖI THIẾU BẢNG NGHIÊM TRỌNG:** Code có lệnh đẩy thông báo lên Supabase nhưng Database không có bảng này, dẫn đến lệnh insert luôn thất bại ngầm. |

---

## 2. KIỂM ĐỊNH ROW LEVEL SECURITY (RLS) VÀ CHÍNH SÁCH TRUY CẬP

Trong file [`supabase_schema.sql`](file:///d:/Lê Lợi Loop/supabase_schema.sql#L89-L141), toàn bộ các bảng đều được kích hoạt RLS (`ENABLE ROW LEVEL SECURITY`). Tuy nhiên, các chính sách bảo vệ thực tế được định nghĩa như sau:

### Phân tích chi tiết từng Policy:
```sql
-- Ví dụ trên bảng items:
CREATE POLICY "Allow public read items" ON public.items FOR SELECT USING (true);
CREATE POLICY "Allow public insert items" ON public.items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update items" ON public.items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete items" ON public.items FOR DELETE USING (true);
```

### ⚠️ Rủi ro an ninh phát hiện được:
1. **Toàn bộ thao tác CRUD đều mở 100% cho `anon` key:**
   - Mệnh đề `USING (true)` và `WITH CHECK (true)` cấp quyền cho bất kỳ ai có `VITE_SUPABASE_ANON_KEY` (vốn là key công khai được đóng gói vào file bundle JavaScript của trình duyệt).
   - Bất kỳ ai mở Console trình duyệt hoặc dùng Postman/cURL đều có thể gửi lệnh `DELETE FROM items` hoặc `UPDATE items SET status = 'completed'` mà không cần bất kỳ quyền quản trị hay mật khẩu nào.
2. **Không có ràng buộc sở hữu dữ liệu (No Ownership Verification):**
   - Học sinh A có thể gửi lệnh sửa bài đăng của Học sinh B.
   - Bất kỳ ai cũng có thể sửa trạng thái của bảng `appointments` hoặc xóa toàn bộ bảng `logs`.

### 💡 Đánh giá góc độ Dự thi KHKT:
- Đối với **vòng thi Khoa học Kỹ thuật học sinh trung học**, cấu hình RLS mở này là giải pháp tình thế phổ biến để đơn giản hóa việc demo nhiều vai trò (RoleSwitcher) mà không bắt buộc giám khảo phải đăng xuất - đăng nhập lại nhiều tài khoản Email thật.
- Tuy nhiên, trong phần thuyết trình hoặc báo cáo kỹ thuật, nhóm dự thi **phải giải thích rõ đây là chế độ Sandbox phục vụ chấm thi**. Khi triển khai chính thức toàn trường, hệ thống bắt buộc phải tích hợp `auth.uid()` để khóa quyền chỉnh sửa của từng học sinh.

---

## 3. PHÂN TÍCH TÍNH NĂNG SUPABASE REALTIME

Đoạn mã cấu hình Realtime trong [`src/context/AppContext.jsx:189-207`](file:///d:/Lê Lợi Loop/src/context/AppContext.jsx#L189-L207):
```javascript
const channel = supabase
  .channel('le-loi-loop-realtime')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => { loadDataFromSupabase(); })
  .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => { loadDataFromSupabase(); })
  .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => { loadDataFromSupabase(); })
  .on('postgres_changes', { event: '*', schema: 'public', table: 'logs' }, () => { loadDataFromSupabase(); })
  .subscribe(...);
```

### Đánh giá hiệu năng và hành vi Realtime:
1. **Cơ chế Re-fetch toàn bộ (Full Re-fetch):**
   - Khi có bất kỳ thay đổi nào ở một bảng (dù chỉ là 1 dòng update nhỏ), callback không cập nhật trực tiếp dòng đó vào state mà lại gọi hàm `loadDataFromSupabase()` để tải lại toàn bộ cả 4 bảng (`items`, `requests`, `appointments`, `logs`).
   - Điều này tạo ra lưu lượng mạng lớn nếu có nhiều người cùng tương tác, nhưng với quy mô demo KHKT (vài chục bản ghi) thì chạy rất ổn định và tránh được sai lệch state.
2. **Điều kiện cần để Realtime hoạt động:**
   - Trong SQL, lệnh `ALTER PUBLICATION supabase_realtime ADD TABLE ...` bắt buộc phải được chạy thành công trên Supabase Dashboard.
   - Nếu lệnh SQL trước đó bị dừng do lỗi duplicate policy, publication Realtime chưa được kích hoạt thì tính năng lắng nghe tự động giữa các máy tính sẽ không phát tín hiệu.
