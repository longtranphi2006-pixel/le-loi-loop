-- =========================================================================
-- FILE: 004_add_unique_constraints.sql
-- MỤC ĐÍCH: Bổ sung các chỉ mục Unique bán phần (Partial Unique Indexes) chống lỗi Race Condition
-- =========================================================================
-- Giả định (Assumptions): Dữ liệu cũ đã được quét sạch sẽ qua 001_preflight_checks.sql.
-- Điều kiện tiên quyết (Preconditions): Không có dòng dữ liệu cũ nào bị trùng (Đã verified live sạch).
-- Rủi ro (Risk Level): TRUNG BÌNH (P1) - Sẽ báo lỗi nếu có dữ liệu trùng lặp tồn tại từ trước.
-- Chiến lược Rollback (Rollback Strategy):
--   DROP INDEX IF EXISTS public.uq_requests_active_item_requester;
--   DROP INDEX IF EXISTS public.uq_requests_single_winner;
--   DROP INDEX IF EXISTS public.uq_items_single_occupied_slot;
--   DROP INDEX IF EXISTS public.uq_appointments_active_code;
--   DROP INDEX IF EXISTS public.idx_requests_item_id;
--   DROP INDEX IF EXISTS public.idx_requests_requester_id;
--   DROP INDEX IF EXISTS public.idx_appointments_item_id;
-- Trạng thái: READY TO RUN (ĐÃ XÁC MINH DỮ LIỆU SẠCH 100%)
-- =========================================================================

-- 1. CHỐNG DUPLICATE REQUEST: Mỗi học sinh chỉ có tối đa 1 yêu cầu đang chờ/được chọn cho 1 món đồ
-- (Nếu bị rejected thì được phép gửi lại nếu đợt xin mở lại)
CREATE UNIQUE INDEX IF NOT EXISTS uq_requests_active_item_requester 
ON public.requests(item_id, requester_id) 
WHERE status != 'rejected';

-- 2. CHỐNG MULTIPLE WINNERS: Chỉ duy nhất 01 học sinh được chọn (status = 'selected') cho mỗi món đồ
CREATE UNIQUE INDEX IF NOT EXISTS uq_requests_single_winner 
ON public.requests(item_id) 
WHERE status = 'selected';

-- 3. CHỐNG RACE CONDITION Ô KỆ TRẠM: Không cho phép 2 món đồ cùng chiếm 1 ô kệ lưu trữ tại cùng thời điểm
CREATE UNIQUE INDEX IF NOT EXISTS uq_items_single_occupied_slot 
ON public.items(storage_slot) 
WHERE status = 'stored' AND storage_slot IS NOT NULL;

-- 4. BẢO VỆ MÃ NHẬN ĐỒ: Mã nhận đồ 4 chữ số là duy nhất trong các lịch hẹn đang chờ lấy
CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_active_code 
ON public.appointments(pickup_code) 
WHERE status IN ('scheduled', 'ready_for_pickup');

-- 5. CHỈ MỤC TỐI ƯU TRUY VẤN FOREIGN KEYS (Tránh Table Scan khi JOIN bảng)
CREATE INDEX IF NOT EXISTS idx_requests_item_id ON public.requests(item_id);
CREATE INDEX IF NOT EXISTS idx_requests_requester_id ON public.requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_appointments_item_id ON public.appointments(item_id);
CREATE INDEX IF NOT EXISTS idx_items_donor_id ON public.items(donor_id);

-- =========================================================================
-- TRUY VẤN KIỂM CHỨNG KẾT QUẢ SAU KHI CHẠY (VERIFICATION QUERY)
-- =========================================================================
-- Kiểm tra các index đã được tạo thành công trong PostgreSQL Catalog:
SELECT 
    indexname, 
    tablename, 
    indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname IN (
    'uq_requests_active_item_requester',
    'uq_requests_single_winner',
    'uq_items_single_occupied_slot',
    'uq_appointments_active_code'
  );

