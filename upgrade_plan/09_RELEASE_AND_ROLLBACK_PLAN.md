# 09_RELEASE_AND_ROLLBACK_PLAN.md: KẾ HOẠCH TRIỂN KHAI VẬN HÀNH & HOÀN TÁC (ROLLBACK)
**Dự án:** LÊ LỢI LOOP  
**Giai đoạn:** Chuẩn bị phát hành thử nghiệm Pilot (Staging / Production)  
**Quy tắc bất biến:** Không thực thi bất kỳ lệnh nào khi chưa có sự phê duyệt chính thức của Trưởng nhóm dự án.  

---

## 1. CÁC CỔNG KIỂM SOÁT AN TOÀN TRƯỚC KHI BẤM NÚT (PRE-RELEASE GATES)

| Cổng kiểm soát (Gate) | Tiêu chí bắt buộc | Kết quả kiểm tra hiện tại | Quyết định |
| :--- | :--- | :---: | :---: |
| **Cổng 1: Preflight Data Cleanliness** | Chạy `001_preflight_checks.sql`: Toàn bộ 8 câu truy vấn kiểm tra dữ liệu cũ phải trả về **0 dòng vi phạm**. | Đã probe live: 0 request trùng, 0 ô kệ trùng, 0 mã nhận trùng. | **ĐẠT (PASS)** |
| **Cổng 2: Frontend Compatibility** | `npm run build` trên branch mới phải kết thúc với mã thoát `0`, không có lỗi bundle. | Đã build thành công trong 7.09s (`dist/` hoàn chỉnh). | **ĐẠT (PASS)** |
| **Cổng 3: Rollback Readiness** | Mọi lệnh SQL thêm mới đều phải có câu lệnh `DROP` hoàn tác được chuẩn bị sẵn và kiểm chứng cú pháp. | Đầy đủ lệnh hoàn tác cho từng file migration. | **ĐẠT (PASS)** |
| **Cổng 4: KHKT Presentation Safety** | Đảm bảo nếu mất mạng trong lúc thuyết trình trước ban giám khảo, hệ thống không bị trắng màn hình. | Có sẵn cơ chế Offline LocalStorage fallback và RoleSwitcher. | **ĐẠT (PASS)** |

---

## 2. QUY TRÌNH TRIỂN KHAI TỪNG BƯỚC (STEP-BY-STEP EXECUTION RUNBOOK)

> [!IMPORTANT]
> Toàn bộ thao tác thực hiện qua giao diện **Supabase Dashboard -> SQL Editor**. Không dùng script tự động chạy ngầm để đảm bảo người quản trị kiểm soát 100% từng bước.

### Bước 1: Kiểm định Dữ liệu (Chạy `001_preflight_checks.sql`)
1. Dán nội dung `001_preflight_checks.sql` vào SQL Editor.
2. Bấm **Run**.
3. **Điều kiện chuyển bước:** Kiểm tra bảng kết quả, đảm bảo không có cảnh báo vi phạm khóa ngoại mồ côi hay trùng ô kệ.

### Bước 2: Kích hoạt Bảng Thông báo (Chạy `002_add_notifications.sql`)
1. Dán nội dung `002_add_notifications.sql` vào SQL Editor.
2. Bấm **Run**.
3. **Xác minh kết quả:**
   ```sql
   SELECT count(*) FROM public.notifications;
   ```
   Nếu trả về `0` (bảng đã tạo thành công và rỗng), bước này hoàn tất.

### Bước 3: Kích hoạt Bảng Quản lý Trạm (Chạy `003_add_station_storage.sql`)
1. Dán nội dung `003_add_station_storage.sql` vào SQL Editor.
2. Bấm **Run**.
3. **Xác minh kết quả:**
   ```sql
   SELECT count(*) FROM public.station_slots;
   ```
   Nếu trả về `10` (đã nạp sẵn 10 ô kệ `K1-A1` đến `K1-B5`), bước này hoàn tất.

### Bước 4: Thêm Ràng buộc & Chỉ mục Unique (Chạy `004_add_unique_constraints.sql`)
1. Dán nội dung `004_add_unique_constraints.sql` vào SQL Editor.
2. Bấm **Run**.
3. **Xác minh kết quả:**
   ```sql
   SELECT indexname FROM pg_indexes WHERE tablename = 'requests' AND indexname = 'uq_requests_active_item_requester';
   ```
   Nếu trả về 1 dòng tên index, bước này hoàn tất.

---

## 3. KỊCH BẢN HOÀN TÁC KHẨN CẤP (EMERGENCY ROLLBACK)

Nếu phát hiện bất kỳ sự cố nào làm gián đoạn ứng dụng trong quá trình thử nghiệm:

### 3.1. Hoàn tác Database (Thực thi trong Supabase SQL Editor trong 30 giây):
```sql
-- 1. Xóa các Unique Index mới thêm
DROP INDEX IF EXISTS public.uq_requests_active_item_requester;
DROP INDEX IF EXISTS public.uq_requests_single_winner;
DROP INDEX IF EXISTS public.uq_items_single_occupied_slot;
DROP INDEX IF EXISTS public.idx_requests_item_id;
DROP INDEX IF EXISTS public.idx_requests_requester_id;
DROP INDEX IF EXISTS public.idx_appointments_item_id;
DROP INDEX IF EXISTS public.idx_notifications_recipient;

-- 2. Xóa các bảng phụ mới thêm
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.notifications;
DROP TABLE IF EXISTS public.storage_assignments;
DROP TABLE IF EXISTS public.station_slots;
DROP TABLE IF EXISTS public.notifications;
```

### 3.2. Hoàn tác Frontend:
Trên terminal máy lập trình, chỉ cần chạy 1 lệnh để quay về phiên bản ổn định ban đầu:
```powershell
git checkout main
```
Ứng dụng sẽ lập tức trở về trạng thái ổn định phục vụ chấm thi KHKT mà không làm mất bất kỳ dữ liệu nào.

