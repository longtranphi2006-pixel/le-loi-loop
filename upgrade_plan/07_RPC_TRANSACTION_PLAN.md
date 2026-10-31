# 07_RPC_TRANSACTION_PLAN.md: THIẾT KẾ CÁC GIAO DỊCH NGUYÊN TỬ (RPC TRANSACTIONS)
**Dự án:** LÊ LỢI LOOP  
**Mục tiêu:** Đảm bảo tính toàn vẹn dữ liệu ACID cho các thao tác đa bảng và siết chặt bảo mật máy chủ.  
**Nguyên tắc bảo mật số 1:** **TUYỆT ĐỐI KHÔNG TIN TƯỞNG THAM SỐ ĐỊNH DANH TỪ FRONTEND (`donor_id`, `checker_id`, `operator_id`).**  
Danh tính người gọi bắt buộc phải được xác minh trực tiếp từ hàm `auth.uid()` của PostgreSQL và quyền trong bảng `users` / `profiles`.

---

## 1. NGUY CƠ BẢO MẬT CỦA CÁC HÀM RPC HIỆN TẠI TRONG BẢN NHÁP CŨ

Trong bản nháp migration trước đó (`MIGRATIONS/20261030_cloud_multi_user_pilot.sql`):
```sql
-- LỖI BẢO MẬT TRONG BẢN NHÁP CŨ:
CREATE OR REPLACE FUNCTION public.rpc_accept_request_by_donor(
    p_request_id TEXT,
    p_donor_id TEXT -- << LỖI: Nhận donor_id do frontend tự truyền lên!
) ...
```
- **Lỗ hổng:** Kẻ xấu có thể mở Console trình duyệt, gọi `supabase.rpc('rpc_accept_request_by_donor', { p_request_id: 'REQ-001', p_donor_id: 'HS001' })` để giả mạo người cho và duyệt đồ của người khác.

---

## 2. THIẾT KẾ RPC CHUẨN AN TOÀN (PRODUCTION-GRADE SECURE RPC)

### 2.1. RPC 1: `rpc_accept_request_by_donor(p_request_id TEXT)`
- **Tham số nhận:** Chỉ nhận `p_request_id`.
- **Cơ chế xác minh:**
  1. Lấy định danh người gọi từ phiên JWT: `v_auth_id := auth.uid()::text`.
  2. Truy vấn người đăng món đồ: `SELECT donor_id INTO v_donor_id FROM items WHERE id = v_req.item_id`.
  3. Kiểm tra quyền:
     - Nếu `v_auth_id != v_donor_id` VÀ người gọi không phải là giáo viên (`teacher`), ném ngoại lệ:
       ```sql
       RAISE EXCEPTION 'Bạn không có quyền duyệt yêu cầu cho món đồ này!';
       ```
  4. Thực thi trong cùng 1 transaction:
     - Cập nhật request được chọn sang `selected`, các request khác sang `backup`.
     - Cập nhật món đồ sang `matching` và đóng nhận yêu cầu `request_status = 'closed'`.
     - Tự động tạo bản ghi `notifications` cho người nhận.
     - Ghi nhật ký `logs`.

### 2.2. RPC 2: `rpc_inspect_and_receive_item(p_apt_id TEXT, p_passed BOOLEAN, p_note TEXT, p_storage_slot TEXT)`
- **Tham số nhận:** Thông tin lịch hẹn, kết quả kiểm định, ghi chú, ô kệ.
- **Cơ chế xác minh:**
  1. Kiểm tra vai trò của người gọi:
     ```sql
     SELECT role INTO v_caller_role FROM public.users WHERE id = auth.uid()::text;
     IF v_caller_role NOT IN ('station_staff', 'teacher', 'admin') THEN
         RAISE EXCEPTION 'Chỉ cán bộ trực trạm Phòng Đội hoặc Giáo viên mới có quyền tiếp nhận đồ!';
     END IF;
     ```
  2. **Chống Race Condition gán đè ô kệ:**
     - Khóa dòng bảng `items` với `FOR UPDATE`.
     - Kiểm tra nếu ô kệ đã có đồ khác đang cất giữ (`status = 'stored' AND storage_slot = p_storage_slot`), lập tức dừng giao dịch và báo lỗi:
       ```sql
       RAISE EXCEPTION 'Ô kệ % hiện đã có đồ lưu trữ! Vui lòng chọn ô khác.', p_storage_slot;
       ```
  3. Cập nhật đồng thời `appointments` (`ready_for_pickup`) và `items` (`stored`).

### 2.3. RPC 3: `rpc_complete_handover(p_pickup_code TEXT)`
- **Tham số nhận:** Duy nhất mã nhận đồ 4 chữ số `p_pickup_code`.
- **Cơ chế xác minh:**
  1. Kiểm tra quyền người gọi phải là `station_staff` hoặc `teacher`.
  2. Khóa dòng lịch hẹn:
     ```sql
     SELECT * INTO v_apt FROM public.appointments WHERE UPPER(pickup_code) = UPPER(p_pickup_code) FOR UPDATE;
     ```
  3. Kiểm tra trạng thái:
     - Nếu `v_apt.status = 'completed'` -> Ném lỗi: Mã đã được sử dụng trước đó.
     - Nếu `v_apt.status IN ('cancelled', 'failed_inspection')` -> Ném lỗi: Lịch hẹn không hợp lệ.
  4. Cập nhật đồng thời `appointments` và `items` thành `completed`, giải phóng `storage_slot = NULL`, vô hiệu hóa mã nhận đồ.

---

## 3. QUY TẮC CẤP QUYỀN THỰC THI (EXECUTE PRIVILEGES)

- Thu hồi quyền thực thi mặc định:
  ```sql
  REVOKE EXECUTE ON FUNCTION public.rpc_accept_request_by_donor(TEXT) FROM PUBLIC;
  REVOKE EXECUTE ON FUNCTION public.rpc_inspect_and_receive_item(TEXT, BOOLEAN, TEXT, TEXT) FROM PUBLIC;
  REVOKE EXECUTE ON FUNCTION public.rpc_complete_handover(TEXT) FROM PUBLIC;
  ```
- Chỉ cấp quyền cho role `authenticated` (Người dùng đã đăng nhập có token JWT hợp lệ):
  ```sql
  GRANT EXECUTE ON FUNCTION public.rpc_accept_request_by_donor(TEXT) TO authenticated;
  GRANT EXECUTE ON FUNCTION public.rpc_inspect_and_receive_item(TEXT, BOOLEAN, TEXT, TEXT) TO authenticated;
  GRANT EXECUTE ON FUNCTION public.rpc_complete_handover(TEXT) TO authenticated;
  ```

