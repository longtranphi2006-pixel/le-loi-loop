-- =========================================================================
-- FILE: 001_preflight_checks.sql
-- MỤC ĐÍCH: Kiểm tra toàn diện chất lượng dữ liệu cũ TRƯỚC KHI nâng cấp schema
-- NGUYÊN TẮC: CHỈ CHỨA CÁC CÂU LỆNH SELECT READ-ONLY. TUYỆT ĐỐI KHÔNG SỬA DỮ LIỆU.
-- =========================================================================
-- Giả định (Assumptions): Các bảng users, items, requests, appointments, logs đã tồn tại.
-- Điều kiện tiên quyết (Preconditions): Không có.
-- Rủi ro (Risk Level): KHÔNG CÓ (Mức rủi ro: 0).
-- Chiến lược Rollback: Không cần vì không thay đổi bất kỳ trạng thái nào của DB.
-- Trạng thái: READY TO RUN
-- =========================================================================

-- KIỂM TRA 1: Phát hiện yêu cầu trùng lặp (Cùng 1 học sinh xin cùng 1 món đồ > 1 lần)
-- Kỳ vọng: Trả về 0 dòng.
SELECT 
    'CHECK-01: DUPLICATE_REQUESTS' AS check_name,
    item_id, 
    requester_id, 
    COUNT(*) AS duplicate_count,
    ARRAY_AGG(id) AS request_ids,
    ARRAY_AGG(status) AS statuses
FROM public.requests
WHERE status != 'rejected'
GROUP BY item_id, requester_id
HAVING COUNT(*) > 1;

-- KIỂM TRA 2: Phát hiện > 1 yêu cầu được chọn (selected) cho cùng 1 món đồ
-- Kỳ vọng: Trả về 0 dòng.
SELECT 
    'CHECK-02: MULTIPLE_WINNERS' AS check_name,
    item_id, 
    COUNT(*) AS selected_count,
    ARRAY_AGG(id) AS request_ids,
    ARRAY_AGG(requester_id) AS requester_ids
FROM public.requests
WHERE status = 'selected'
GROUP BY item_id
HAVING COUNT(*) > 1;

-- KIỂM TRA 3: Phát hiện ô kệ lưu trữ bị trùng lặp giữa các món đồ đang lưu kho
-- Kỳ vọng: Trả về 0 dòng.
SELECT 
    'CHECK-03: DUPLICATE_STORAGE_SLOTS' AS check_name,
    storage_slot, 
    COUNT(*) AS occupied_count,
    ARRAY_AGG(id) AS item_ids,
    ARRAY_AGG(title) AS item_titles
FROM public.items
WHERE status = 'stored' AND storage_slot IS NOT NULL
GROUP BY storage_slot
HAVING COUNT(*) > 1;

-- KIỂM TRA 4: Phát hiện khóa ngoại mồ côi (Orphan Foreign Keys)
-- Kỳ vọng: Trả về 0 dòng cho tất cả các bảng.
-- 4.1. Món đồ có donor_id không tồn tại trong bảng users:
SELECT 'CHECK-04A: ORPHAN_ITEM_DONOR' AS check_name, id, title, donor_id 
FROM public.items 
WHERE donor_id IS NOT NULL AND donor_id NOT IN (SELECT id FROM public.users);

-- 4.2. Yêu cầu có item_id hoặc requester_id không tồn tại:
SELECT 'CHECK-04B: ORPHAN_REQUEST_ITEM' AS check_name, id, item_id, requester_id 
FROM public.requests 
WHERE item_id NOT IN (SELECT id FROM public.items) 
   OR requester_id NOT IN (SELECT id FROM public.users);

-- 4.3. Lịch hẹn có item_id hoặc request_id không tồn tại:
SELECT 'CHECK-04C: ORPHAN_APPOINTMENT' AS check_name, id, item_id, request_id 
FROM public.appointments 
WHERE item_id NOT IN (SELECT id FROM public.items)
   OR (request_id IS NOT NULL AND request_id NOT IN (SELECT id FROM public.requests));

-- KIỂM TRA 5: Phát hiện mâu thuẫn trạng thái giữa Lịch hẹn và Món đồ
-- Ví dụ: Lịch hẹn đã completed nhưng món đồ vẫn đang stored hoặc matching
-- Kỳ vọng: Trả về 0 dòng.
SELECT 
    'CHECK-05: STATUS_INCONSISTENCY' AS check_name,
    a.id AS apt_id, 
    a.status AS apt_status, 
    i.id AS item_id, 
    i.status AS item_status
FROM public.appointments a
JOIN public.items i ON a.item_id = i.id
WHERE (a.status = 'completed' AND i.status != 'completed')
   OR (a.status = 'ready_for_pickup' AND i.status NOT IN ('stored', 'matching'));

-- KIỂM TRA 6: Phát hiện mâu thuẫn giữa Mã học sinh và Tên hiển thị
-- Kỳ vọng: Trả về 0 dòng (Tên trong request phải khớp tên trong users).
SELECT 
    'CHECK-06: USER_NAME_MISMATCH' AS check_name,
    r.id AS request_id, 
    r.requester_id, 
    r.requester_name AS name_in_request, 
    u.name AS name_in_users
FROM public.requests r
JOIN public.users u ON r.requester_id = u.id
WHERE r.requester_name != u.name;

-- KIỂM TRA 7: Phát hiện Lịch hẹn tham chiếu Request của món đồ khác (Mismatched Item-Request)
-- Kỳ vọng: Trả về 0 dòng.
SELECT 
    'CHECK-07: APPOINTMENT_REQUEST_MISMATCH' AS check_name,
    a.id AS appointment_id,
    a.item_id AS apt_item_id,
    r.id AS request_id,
    r.item_id AS req_item_id
FROM public.appointments a
JOIN public.requests r ON a.request_id = r.id
WHERE a.item_id != r.item_id;

-- KIỂM TRA 8: Phát hiện mã nhận đồ (pickup_code) bị trùng lặp trong các lịch đang hoạt động
-- Kỳ vọng: Trả về 0 dòng.
SELECT 
    'CHECK-08: DUPLICATE_ACTIVE_PICKUP_CODE' AS check_name,
    pickup_code,
    COUNT(*) AS code_count,
    ARRAY_AGG(id) AS apt_ids,
    ARRAY_AGG(status) AS apt_statuses
FROM public.appointments
WHERE status IN ('scheduled', 'ready_for_pickup')
GROUP BY pickup_code
HAVING COUNT(*) > 1;

