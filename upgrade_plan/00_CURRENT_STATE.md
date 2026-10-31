# 00_CURRENT_STATE.md: KHÓA PHIÊN BẢN & ĐỐI CHIẾU MÃ NGUỒN HIỆN TẠI
**Dự án:** LÊ LỢI LOOP - Hệ thống Tuần hoàn Đồ dùng Học tập THCS Lê Lợi  
**Giai đoạn:** Giai đoạn 1 - Kiểm kê & Lập Kế hoạch Migration Database  
**Thời điểm thực hiện:** 30/10/2026 - 19:30 (Giờ địa phương)  
**Kiến trúc sư phụ trách:** Senior PostgreSQL/Supabase Architect & Senior QA Engineer  

---

## 1. THÔNG TIN PHIÊN BẢN SOURCE HIỆN TẠI (GIT REPOSITORY LOCK)

| Thuộc tính | Giá trị ghi nhận thực tế | Ghi chú kỹ thuật |
| :--- | :--- | :--- |
| **Git Branch** | `fix/cloud-multi-user-pilot` | Đã tách nhánh từ `main`, chưa merge vào `main`. |
| **Commit Hash** | `6e590b4426ed3a503e885a9ae004073e9c86f570` | Commit: *"feat(pilot): prepare cloud multi-user pilot with rpc, cloud notifications, route guard and migration"* |
| **Tác giả Commit** | `longtranphi2006-pixel <longtranphi2006@gmail.com>` | Ngày commit: Fri Oct 30 18:23:27 2026 +0700 |
| **Working Tree Status** | Sạch sau commit (Chỉ tồn tại tệp tài liệu mới và thư mục audit) | Không có tệp mã nguồn nào bị dirty hoặc conflict. |
| **Supabase Client Library**| `@supabase/supabase-js: ^2.118.0` | Đã cấu hình `persistSession: true` tại `src/lib/supabase.js`. |
| **Frontend Framework** | `React 18.3.1` + `Vite 6.0.3` + `TailwindCSS 3.4.16` | Build Vite hoàn tất trong 7.09s, 0 lỗi cú pháp. |

---

## 2. ĐỐI CHIẾU THỰC TẾ SOURCE HIỆN TẠI VS BÁO CÁO TRƯỚC ĐÓ

> [!CAUTION]
> **QUY TẮC BẮT BUỘC:** Không được giả định bất kỳ tính năng sửa đổi nào đã hoạt động hoàn chỉnh trên Cloud chỉ vì báo cáo trước đó đã đề cập. Phải đối chiếu từng dòng mã nguồn trong `src/context/AppContext.jsx` và trạng thái Database thực tế.

### Bảng đối chiếu chi tiết:

| Hạng mục đối chiếu | Nội dung báo cáo trước | Hiện trạng thực tế trong mã nguồn hiện tại | Đánh giá & Rủi ro còn tồn tại |
| :--- | :--- | :--- | :--- |
| **Cơ chế sinh ID** | Báo cáo nói đã thay `items.length + 1` bằng UUID | **ĐÚNG MỘT PHẦN:** Đã sử dụng `genUniqueId('M')`, `genUniqueId('REQ')`, `genUniqueId('APT')`. | **CẢNH BÁO:** Database schema live vẫn dùng kiểu `TEXT` cho PK (ví dụ: `M-78A1B2C3`), chưa phải kiểu dữ liệu `UUID` gốc của PostgreSQL. |
| **LocalStorage-First** | Báo cáo nói Supabase là Single Source of Truth | **CHƯA HOÀN TOÀN:** State khởi tạo trong `AppContext.jsx` (dòng 43-102) **vẫn đọc LocalStorage trước**: `const [items, setItems] = useState(() => localStorage.getItem(...) || INITIAL_ITEMS)`. Đồng thời `useEffect` (dòng 117-127) vẫn ghi đè liên tục vào LocalStorage mỗi khi state thay đổi. | **RỦI RO:** Khi mở ứng dụng, màn hình nháy dữ liệu LocalStorage cũ trong 0.5s - 1.5s trước khi lệnh `loadDataFromSupabase()` hoàn tất. |
| **Dữ liệu Cloud rỗng (`[]`)** | Báo cáo nói đã fix để nhận `[]` | **ĐÃ FIX:** Dòng 155-169 trong `AppContext.jsx` đã đổi từ `if (data.length > 0)` thành `if (Array.isArray(data)) setItems(data.map(...))`. | Đạt tiêu chuẩn: khi Cloud rỗng, state trở thành rỗng. |
| **Bảng Notifications trên Cloud** | Báo cáo đề xuất bảng notifications | **CHƯA CÓ TRÊN DATABASE LIVE:** Truy vấn live `GET /rest/v1/notifications` trả về `HTTP 404 (PGRST205)`. | **LỖI TỒN TẠI:** Trong `loadDataFromSupabase`, dòng 172-174 bỏ qua nếu `notifsRes.error`, dẫn đến bảng notifications tiếp tục phụ thuộc 100% vào LocalStorage. Hàm `createNotification` (dòng 344-348) bắt lỗi `catch` và chỉ in `console.warn`. |
| **Phiên Auth thực tế** | Báo cáo đề xuất Supabase Auth | **CHƯA TRIỂN KHAI:** Hệ thống vẫn hoàn toàn phụ thuộc vào `RoleSwitcher.jsx` và mảng `USERS` tĩnh trong `src/data/seedData.js`. Không có token JWT xác thực người dùng. | **RỦI RO:** Mọi request lên Cloud đều gửi bằng role `anon`. Không thể xác minh ai là người thực sự gửi request hay duyệt đồ. |
| **RPC Stored Procedures** | Code frontend đã thêm lệnh gọi `supabase.rpc(...)` | **CHƯA CÓ TRÊN DATABASE LIVE:** Các hàm `rpc_accept_request_by_donor`, `rpc_inspect_and_receive_item`, `rpc_complete_handover` **chưa hề được tạo trên database Supabase live**. | Code hiện tại đang tự động rơi vào nhánh **Fallback** (cập nhật song song từng bảng). Chưa có tính nguyên tử ACID trên Cloud. |

---

## 3. DANH MỤC CÁC TỆP TIN ĐÃ ĐỌC VÀ KHÓA PHIÊN BẢN

1. `src/context/AppContext.jsx` (1,184 dòng): Toàn bộ trạng thái React, logic nghiệp vụ, đồng bộ Dual-Storage, xử lý RPC và các hàm mutation.
2. `src/lib/supabase.js` (179 dòng): Khởi tạo Supabase client, cấu hình Auth persistence, hàm sinh ID `genUniqueId` và các hàm map DTO giữa camelCase và snake_case.
3. `src/data/seedData.js` (215 dòng): Danh mục 4 người dùng mẫu (`HS001`, `HS002`, `TR01`, `GV01`), 10 khung giờ trạm, 10 ô kệ lưu trữ (`K1-A1` đến `K1-B5`), và dữ liệu mẫu khởi tạo.
4. `src/utils/loopMatchAlgorithm.js` (248 dòng): Thuật toán cốt lõi tính toán giao điểm khung giờ 3 bên, xử lý nghịch lý thời gian, kiểm tra giới hạn trạm và bốc thăm ngẫu nhiên LCG với seed cố định.
5. `supabase_schema.sql` (219 dòng): File DDL khởi tạo ban đầu (chứa 5 bảng, thiếu notifications, RLS mở toàn bộ).
6. `MIGRATIONS/20261030_cloud_multi_user_pilot.sql` (354 dòng): Bản nháp migration trước đó (chưa áp dụng lên live).
7. `package.json` (28 dòng): Danh mục dependencies và scripts chạy ứng dụng.

