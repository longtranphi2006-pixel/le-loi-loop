-- =========================================================================
-- FILE: 006_security_p0_fixes.sql
-- MỤC ĐÍCH: KHẮC PHỤC TRIỆT ĐỂ TOÀN BỘ LỖI BẢO MẬT P0/P1 VÀ ĐỒNG BỘ NGHIỆP VỤ
-- DỰ ÁN: LÊ LỢI LOOP — THCS LÊ LỢI, THÀNH PHỐ ĐÀ NẴNG
-- MÔI TRƯỜNG THỰC THI: Supabase Staging (Project ID: ynkhukeqdqewakrqtvtu)
-- TUYỆT ĐỐI KHÔNG CHẠY TRÊN: Production (Project ID: vepuogmvrnhpwneufjff)
-- =========================================================================

-- =========================================================================
-- BƯỚC 1: XÓA ĐỊNH DANH TĨNH CÁC CHÍNH SÁCH VÀ TRIGGER CŨ (STATIC & AUDITABLE)
-- Tuyệt đối không dùng vòng lặp con trỏ động quét pg_policies;
-- Liệt kê danh tính cụ thể từng policy cũ từ migration 000-005 để dọn sạch an toàn.
-- =========================================================================

-- 1.1. Bảng public.users
DROP POLICY IF EXISTS "Allow public read users" ON public.users;
DROP POLICY IF EXISTS "Allow public insert users" ON public.users;
DROP POLICY IF EXISTS "Allow public update users" ON public.users;
DROP POLICY IF EXISTS "Public can view users directory" ON public.users;
DROP POLICY IF EXISTS "Only staff or service_role can update users" ON public.users;
DROP POLICY IF EXISTS "Users can only view own record or staff view all" ON public.users;
DROP POLICY IF EXISTS "Users can only update own basic record" ON public.users;

-- 1.2. Bảng public.profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own contact profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles viewable by self or staff" ON public.profiles;
DROP POLICY IF EXISTS "Profiles updateable by self or staff" ON public.profiles;

-- 1.3. Bảng public.items
DROP POLICY IF EXISTS "Allow public all items" ON public.items;
DROP POLICY IF EXISTS "Allow public read items" ON public.items;
DROP POLICY IF EXISTS "Allow public insert items" ON public.items;
DROP POLICY IF EXISTS "Allow public update items" ON public.items;
DROP POLICY IF EXISTS "Allow public delete items" ON public.items;
DROP POLICY IF EXISTS "Public can view approved items" ON public.items;
DROP POLICY IF EXISTS "Students can insert pending items" ON public.items;
DROP POLICY IF EXISTS "Donors or staff can update items" ON public.items;
DROP POLICY IF EXISTS "Users can only update their own items" ON public.items;
DROP POLICY IF EXISTS "Items public view approved or own pending" ON public.items;
DROP POLICY IF EXISTS "Students can insert pending items strictly" ON public.items;
DROP POLICY IF EXISTS "Items update restricted" ON public.items;

-- 1.4. Bảng public.requests
DROP POLICY IF EXISTS "Allow public read requests" ON public.requests;
DROP POLICY IF EXISTS "Allow public insert requests" ON public.requests;
DROP POLICY IF EXISTS "Allow public update requests" ON public.requests;
DROP POLICY IF EXISTS "Allow public delete requests" ON public.requests;
DROP POLICY IF EXISTS "Authorized users can view requests" ON public.requests;
DROP POLICY IF EXISTS "Students can insert own request" ON public.requests;
DROP POLICY IF EXISTS "Requests viewable by requester or donor or staff" ON public.requests;
DROP POLICY IF EXISTS "Students insert own request strictly" ON public.requests;
DROP POLICY IF EXISTS "Requests update restricted" ON public.requests;

-- 1.5. Bảng public.appointments
DROP POLICY IF EXISTS "Allow public read appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authorized participants can view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Donors or staff can insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Participants or staff can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Appointments viewable by participants and staff" ON public.appointments;
DROP POLICY IF EXISTS "Appointments viewable by requester and staff only" ON public.appointments;
DROP POLICY IF EXISTS "Appointments insert strictly checked" ON public.appointments;
DROP POLICY IF EXISTS "Appointments update restricted" ON public.appointments;

-- 1.6. Bảng public.logs
DROP POLICY IF EXISTS "Allow public read logs" ON public.logs;
DROP POLICY IF EXISTS "Allow public insert logs" ON public.logs;
DROP POLICY IF EXISTS "Public can view audit logs" ON public.logs;
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.logs;
DROP POLICY IF EXISTS "Only staff view audit logs" ON public.logs;
DROP POLICY IF EXISTS "Only staff and service_role insert logs" ON public.logs;

-- 1.7. Bảng public.notifications
DROP POLICY IF EXISTS "Allow public all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can only read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Notifications insert strictly checked" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications read status" ON public.notifications;

-- 1.8. Bảng public.station_slots
DROP POLICY IF EXISTS "Public can view station_slots" ON public.station_slots;
DROP POLICY IF EXISTS "Public view station slots directory" ON public.station_slots;
DROP POLICY IF EXISTS "Only staff manage station slots" ON public.station_slots;

-- 1.9. Bảng public.storage_assignments
DROP POLICY IF EXISTS "Public can view storage_assignments" ON public.storage_assignments;
DROP POLICY IF EXISTS "Allow staff update storage_assignments" ON public.storage_assignments;
DROP POLICY IF EXISTS "Only staff view and manage storage assignments" ON public.storage_assignments;

-- Dọn dẹp các trigger cũ
DROP TRIGGER IF EXISTS trg_protect_users ON public.users;
DROP TRIGGER IF EXISTS trg_protect_profile ON public.profiles;
DROP TRIGGER IF EXISTS trg_protect_item_lifecycle ON public.items;
DROP TRIGGER IF EXISTS trg_protect_request_lifecycle ON public.requests;
DROP TRIGGER IF EXISTS trg_protect_appointment_lifecycle ON public.appointments;
DROP TRIGGER IF EXISTS trg_protect_storage_assignments ON public.storage_assignments;
DROP TRIGGER IF EXISTS trg_protect_notification ON public.notifications;
DROP TRIGGER IF EXISTS trg_enforce_notification_sender ON public.notifications;
DROP TRIGGER IF EXISTS trg_sync_profiles_to_users ON public.profiles;
DROP TRIGGER IF EXISTS trg_sync_users_to_profiles ON public.users;

-- Dọn dẹp triệt để các phiên bản hàm RPC cũ (chống Function Overload)
DROP FUNCTION IF EXISTS public.rpc_accept_request_by_donor(TEXT);
DROP FUNCTION IF EXISTS public.rpc_inspect_and_receive_item(TEXT, BOOLEAN, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.rpc_complete_handover(TEXT);
DROP FUNCTION IF EXISTS public.rpc_complete_handover(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.rpc_cancel_appointment(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.rpc_reschedule_appointment(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.rpc_get_my_dropoff_schedules();

-- Bật cưỡng chế RLS trên 100% các bảng
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.station_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_assignments ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- BƯỚC 2: PHÂN QUYỀN CẤP BẢNG VÀ CỘT (TABLE-LEVEL & COLUMN-LEVEL GRANTS)
-- =========================================================================
-- Thu hồi quyền mặc định từ anon và public
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Khách vãng lai (anon) chỉ được xem danh mục ô kệ công khai
GRANT SELECT ON public.station_slots TO anon;

-- Thu hồi quyền DELETE trên toàn bộ các bảng đối với người dùng thông thường
REVOKE DELETE ON public.users, public.profiles, public.items, public.requests,
                  public.appointments, public.logs, public.notifications,
                  public.station_slots, public.storage_assignments FROM authenticated;

-- Thu hồi tuyệt đối quyền UPDATE và DELETE trên nhật ký kiểm toán (logs)
REVOKE ALL ON public.logs FROM PUBLIC, anon;
REVOKE UPDATE, DELETE ON public.logs FROM authenticated;
GRANT SELECT, INSERT ON public.logs TO authenticated;

-- Thu hồi quyền chỉnh sửa trực tiếp storage_assignments từ authenticated (chỉ thao tác qua RPC)
REVOKE ALL ON public.storage_assignments FROM PUBLIC, anon;
GRANT SELECT ON public.storage_assignments TO authenticated;

-- Cấp quyền SELECT, INSERT, UPDATE cần thiết cho người dùng đã xác thực
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.items TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.appointments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT ON public.station_slots TO authenticated;

-- =========================================================================
-- BƯỚC 3: XÁC ĐỊNH NGUỒN DỮ LIỆU THẨM QUYỀN (SSOT) CHO ROLE & POINTS
-- public.profiles là Nguồn Thẩm Quyền Duy Nhất (Single Source of Truth) cho Auth.
-- Trigger đồng bộ hai chiều có kiểm tra pg_trigger_depth() để tránh xung đột.
-- =========================================================================

-- 3.1. Hàm tiện ích lấy hồ sơ tài khoản đang gọi
CREATE OR REPLACE FUNCTION public.get_current_profile()
RETURNS TABLE (legacy_id TEXT, user_role TEXT, name TEXT, user_points INTEGER) 
LANGUAGE sql 
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
    SELECT 
        COALESCE(p.legacy_user_id, p.auth_user_id::text) AS legacy_id,
        p.role AS user_role,
        p.full_name AS name,
        p.points AS user_points
    FROM public.profiles p 
    WHERE p.auth_user_id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.get_current_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_current_profile() TO authenticated, service_role;

-- 3.2. Trigger đồng bộ từ profiles sang users (khi profiles đổi role/points)
CREATE OR REPLACE FUNCTION public.trg_sync_profiles_to_users()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
    IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
    
    IF NEW.legacy_user_id IS NOT NULL THEN
        UPDATE public.users 
        SET role = NEW.role,
            points = NEW.points,
            name = COALESCE(NEW.full_name, name)
        WHERE id = NEW.legacy_user_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_profiles_to_users
AFTER UPDATE OF role, points, full_name ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_sync_profiles_to_users();

-- 3.3. Trigger đồng bộ từ users sang profiles (khi admin cập nhật users)
CREATE OR REPLACE FUNCTION public.trg_sync_users_to_profiles()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
    IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;

    UPDATE public.profiles 
    SET role = NEW.role,
        points = NEW.points,
        full_name = COALESCE(NEW.name, full_name)
    WHERE legacy_user_id = NEW.id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_users_to_profiles
AFTER UPDATE OF role, points, name ON public.users
FOR EACH ROW EXECUTE FUNCTION public.trg_sync_users_to_profiles();

-- 3.4. Trigger khóa cứng các trường bất biến trong public.profiles
CREATE OR REPLACE FUNCTION public.trg_protect_profile_immutable_fields()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF current_setting('role', true) = 'service_role' THEN RETURN NEW; END IF;

    IF OLD.auth_user_id IS DISTINCT FROM NEW.auth_user_id THEN
        RAISE EXCEPTION 'Bảo mật: Không được phép thay đổi liên kết auth_user_id!';
    END IF;
    IF OLD.legacy_user_id IS DISTINCT FROM NEW.legacy_user_id THEN
        RAISE EXCEPTION 'Bảo mật: Không được phép thay đổi mã định danh legacy_user_id!';
    END IF;
    IF OLD.role IS DISTINCT FROM NEW.role AND (SELECT user_role FROM public.get_current_profile()) NOT IN ('admin') THEN
        RAISE EXCEPTION 'Từ chối quyền: Bạn không có quyền tự ý thay đổi vai trò (role)!';
    END IF;
    IF OLD.points IS DISTINCT FROM NEW.points AND (SELECT user_role FROM public.get_current_profile()) NOT IN ('teacher', 'admin') THEN
        RAISE EXCEPTION 'Từ chối quyền: Bạn không có quyền tự ý thay đổi điểm tích lũy (points)!';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_profile
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_protect_profile_immutable_fields();

-- 3.5. Trigger khóa cứng các trường bất biến trong public.users
CREATE OR REPLACE FUNCTION public.trg_protect_users_immutable_fields()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF current_setting('role', true) = 'service_role' THEN RETURN NEW; END IF;

    IF OLD.id != NEW.id THEN
        RAISE EXCEPTION 'Bảo mật: Không được phép thay đổi mã định danh người dùng (id)!';
    END IF;
    IF OLD.role IS DISTINCT FROM NEW.role AND (SELECT user_role FROM public.get_current_profile()) NOT IN ('admin') THEN
        RAISE EXCEPTION 'Từ chối quyền: Bạn không có quyền tự ý thay đổi vai trò (role)!';
    END IF;
    IF OLD.points IS DISTINCT FROM NEW.points AND (SELECT user_role FROM public.get_current_profile()) NOT IN ('teacher', 'admin') THEN
        RAISE EXCEPTION 'Từ chối quyền: Bạn không có quyền tự ý thay đổi điểm số (points)!';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_users
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.trg_protect_users_immutable_fields();

-- =========================================================================
-- BƯỚC 4: BẢO VỆ BẢNG USERS VÀ PROFILES (RLS)
-- Bảo vệ tuyệt đối thông tin cá nhân (SĐT, lớp), chống học sinh thu thập dữ liệu
-- =========================================================================

CREATE POLICY "Users can only view own record or staff view all" ON public.users
FOR SELECT USING (
    auth.role() = 'service_role'
    OR (
        auth.uid() IS NOT NULL AND (
            id = (SELECT legacy_id FROM public.get_current_profile())
            OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'station_staff', 'admin')
        )
    )
);

CREATE POLICY "Users can only update own basic record" ON public.users
FOR UPDATE USING (
    auth.role() = 'service_role'
    OR (
        auth.uid() IS NOT NULL AND (
            id = (SELECT legacy_id FROM public.get_current_profile())
            OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'admin')
        )
    )
) WITH CHECK (
    auth.role() = 'service_role'
    OR (
        auth.uid() IS NOT NULL AND (
            id = (SELECT legacy_id FROM public.get_current_profile())
            OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'admin')
        )
    )
);

CREATE POLICY "Profiles viewable by self or staff" ON public.profiles
FOR SELECT USING (
    auth.role() = 'service_role'
    OR (
        auth.uid() IS NOT NULL AND (
            auth_user_id = auth.uid()
            OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'station_staff', 'admin')
        )
    )
);

CREATE POLICY "Profiles updateable by self or staff" ON public.profiles
FOR UPDATE USING (
    auth.role() = 'service_role'
    OR (
        auth.uid() IS NOT NULL AND (
            auth_user_id = auth.uid()
            OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'admin')
        )
    )
) WITH CHECK (
    auth.role() = 'service_role'
    OR (
        auth.uid() IS NOT NULL AND (
            auth_user_id = auth.uid()
            OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'admin')
        )
    )
);

-- =========================================================================
-- BƯỚC 5: BẢO VỆ BẢNG ITEMS (RLS & CHẶN CẬP NHẬT TRỰC TIẾP BỎ QUA RPC)
-- =========================================================================
CREATE POLICY "Items public view approved or own pending" ON public.items
FOR SELECT USING (
    status IN ('approved', 'matching', 'stored', 'ready_for_pickup', 'completed')
    OR (
        auth.uid() IS NOT NULL AND (
            donor_id = (SELECT legacy_id FROM public.get_current_profile())
            OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'station_staff', 'admin')
        )
    )
    OR auth.role() = 'service_role'
);

CREATE POLICY "Students can insert pending items strictly" ON public.items
FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
    OR (
        auth.uid() IS NOT NULL
        AND donor_id = (SELECT legacy_id FROM public.get_current_profile())
        AND status = 'pending'
        AND request_status IN ('closed', 'open')
        AND storage_slot IS NULL
    )
);

CREATE POLICY "Items update restricted" ON public.items
FOR UPDATE USING (
    auth.role() = 'service_role'
    OR (
        auth.uid() IS NOT NULL AND (
            (donor_id = (SELECT legacy_id FROM public.get_current_profile()) AND status IN ('pending', 'needs_update'))
            OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'station_staff', 'admin')
        )
    )
) WITH CHECK (
    auth.role() = 'service_role'
    OR (
        auth.uid() IS NOT NULL AND (
            (donor_id = (SELECT legacy_id FROM public.get_current_profile()) AND status IN ('pending', 'needs_update'))
            OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'station_staff', 'admin')
        )
    )
);

-- Trigger chặn học sinh tự duyệt bài và chặn cập nhật trạng thái quan trọng bỏ qua RPC
CREATE OR REPLACE FUNCTION public.trg_protect_item_lifecycle()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF current_setting('role', true) = 'service_role' THEN RETURN NEW; END IF;

    -- Không được sửa donor_id của món đồ
    IF OLD.donor_id != NEW.donor_id THEN
        RAISE EXCEPTION 'Bảo mật: Không được phép thay đổi người sở hữu món đồ (donor_id)!';
    END IF;

    -- Học sinh không được phép tự duyệt bài đăng của chính mình
    IF (SELECT user_role FROM public.get_current_profile()) = 'student' THEN
        IF OLD.status != NEW.status AND NEW.status NOT IN ('pending', 'needs_update') THEN
            RAISE EXCEPTION 'Từ chối quyền: Học sinh không thể tự thay đổi trạng thái kiểm duyệt bài đăng!';
        END IF;
    END IF;

    -- Chặn cập nhật sang trạng thái 'stored' nếu không chạy qua RPC kiểm định (kể cả staff)
    IF NEW.status = 'stored' AND OLD.status != 'stored' THEN
        IF COALESCE(current_setting('leloiloop.authorized_rpc', true), '') != 'true' THEN
            RAISE EXCEPTION 'Bảo mật: Món đồ chỉ được chuyển sang trạng thái lưu trạm (stored) thông qua quy trình tiếp nhận rpc_inspect_and_receive_item!';
        END IF;
    END IF;

    -- Chặn cập nhật sang trạng thái 'completed' nếu không chạy qua RPC bàn giao
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        IF COALESCE(current_setting('leloiloop.authorized_rpc', true), '') != 'true' THEN
            RAISE EXCEPTION 'Bảo mật: Món đồ chỉ được chuyển sang hoàn tất (completed) thông qua quy trình bàn giao rpc_complete_handover!';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_item_lifecycle
BEFORE UPDATE ON public.items
FOR EACH ROW EXECUTE FUNCTION public.trg_protect_item_lifecycle();

-- =========================================================================
-- BƯỚC 6: BẢO VỆ BẢNG REQUESTS (RLS & TRIGGER KHÓA CỘT, CHẶN TỰ CHỌN WINNER)
-- =========================================================================
CREATE POLICY "Requests viewable by requester or donor or staff" ON public.requests
FOR SELECT USING (
    auth.role() = 'service_role'
    OR (
        auth.uid() IS NOT NULL AND (
            requester_id = (SELECT legacy_id FROM public.get_current_profile())
            OR EXISTS (
                SELECT 1 FROM public.items i 
                WHERE i.id = requests.item_id 
                  AND i.donor_id = (SELECT legacy_id FROM public.get_current_profile())
            )
            OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'station_staff', 'admin')
        )
    )
);

CREATE POLICY "Students insert own request strictly" ON public.requests
FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
    OR (
        auth.uid() IS NOT NULL
        AND requester_id = (SELECT legacy_id FROM public.get_current_profile())
        AND status = 'pending'
        AND lottery_rank IS NULL
        AND NOT EXISTS (
            SELECT 1 FROM public.items i 
            WHERE i.id = requests.item_id 
              AND i.donor_id = (SELECT legacy_id FROM public.get_current_profile())
        )
    )
);

CREATE POLICY "Requests update restricted" ON public.requests
FOR UPDATE USING (
    auth.role() = 'service_role'
    OR (
        auth.uid() IS NOT NULL AND (
            (requester_id = (SELECT legacy_id FROM public.get_current_profile()) AND status = 'pending')
            OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'admin')
        )
    )
) WITH CHECK (
    auth.role() = 'service_role'
    OR (
        auth.uid() IS NOT NULL AND (
            (requester_id = (SELECT legacy_id FROM public.get_current_profile()) AND status IN ('pending', 'cancelled'))
            OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'admin')
        )
    )
);

-- Trigger bảo vệ tính toàn vẹn của requests
CREATE OR REPLACE FUNCTION public.trg_protect_request_lifecycle()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF current_setting('role', true) = 'service_role' THEN RETURN NEW; END IF;

    -- Không được sửa item_id hoặc requester_id
    IF OLD.item_id != NEW.item_id THEN
        RAISE EXCEPTION 'Bảo mật: Không được phép thay đổi món đồ liên kết (item_id)!';
    END IF;
    IF OLD.requester_id != NEW.requester_id THEN
        RAISE EXCEPTION 'Bảo mật: Không được phép thay đổi người gửi yêu cầu (requester_id)!';
    END IF;

    -- Cấm học sinh tự ý thay đổi thứ hạng bốc thăm
    IF OLD.lottery_rank IS DISTINCT FROM NEW.lottery_rank THEN
        IF (SELECT user_role FROM public.get_current_profile()) NOT IN ('teacher', 'admin') THEN
            RAISE EXCEPTION 'Từ chối quyền: Bạn không có quyền tự ý thay đổi thứ hạng bốc thăm (lottery_rank)!';
        END IF;
    END IF;

    -- Chặn chuyển sang trạng thái 'selected' trực tiếp mà không qua RPC rpc_accept_request_by_donor
    IF NEW.status = 'selected' AND OLD.status != 'selected' THEN
        IF COALESCE(current_setting('leloiloop.authorized_rpc', true), '') != 'true' 
           AND (SELECT user_role FROM public.get_current_profile()) NOT IN ('teacher', 'admin') THEN
            RAISE EXCEPTION 'Bảo mật: Việc chọn người nhận (selected) bắt buộc phải thực hiện thông qua quy trình rpc_accept_request_by_donor hoặc bốc thăm công khai!';
        END IF;
    END IF;

    -- Học sinh chỉ được phép hủy yêu cầu khi đang pending
    IF (SELECT user_role FROM public.get_current_profile()) = 'student' THEN
        IF OLD.status != 'pending' AND NEW.status != OLD.status THEN
            RAISE EXCEPTION 'Từ chối: Yêu cầu đã có kết quả xét chọn hoặc đã hủy, không thể thay đổi trạng thái!';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_request_lifecycle
BEFORE UPDATE ON public.requests
FOR EACH ROW EXECUTE FUNCTION public.trg_protect_request_lifecycle();

-- =========================================================================
-- BƯỚC 7: BẢO VỆ BẢNG APPOINTMENTS & LỘ TRÌNH PICKUP_CODE
-- 1. Quyền SELECT: Chỉ NGƯỜI NHẬN (requester) và CÁN BỘ TRẠM/GIÁO VIÊN mới được đọc bảng appointments.
--    NGƯỜI CHO (donor) KHÔNG ĐƯỢC SELECT appointments trực tiếp (Tránh hoàn toàn việc lộ pickup_code).
-- 2. Người cho xem lịch mang đồ tới trạm thông qua RPC rpc_get_my_dropoff_schedules() đã được ẩn mã nhận.
-- 3. Loại bỏ so sánh cột với chính nó trong WITH CHECK; bảo vệ bằng Trigger trg_protect_appointment_lifecycle.
-- =========================================================================

-- 7.1. Chính sách SELECT: Loại bỏ donor_id khỏi appointments để giấu tuyệt đối pickup_code
CREATE POLICY "Appointments viewable by requester and staff only" ON public.appointments
FOR SELECT USING (
    auth.role() = 'service_role'
    OR (
        auth.uid() IS NOT NULL AND (
            requester_id = (SELECT legacy_id FROM public.get_current_profile())
            OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'station_staff', 'admin')
        )
    )
);

-- 7.2. Chính sách INSERT: Ràng buộc chặt chẽ liên kết món matching và yêu cầu selected
CREATE POLICY "Appointments insert strictly checked" ON public.appointments
FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
    OR (
        auth.uid() IS NOT NULL
        AND status = 'scheduled'
        AND storage_slot IS NULL
        AND donor_arrived_at IS NULL
        AND picked_up_at IS NULL
        AND pickup_code ~ '^LOOP-[0-9]{4}$'
        AND (
            donor_id = (SELECT legacy_id FROM public.get_current_profile())
            OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'station_staff', 'admin')
        )
        AND EXISTS (
            SELECT 1 FROM public.items i
            WHERE i.id = appointments.item_id
              AND i.donor_id = appointments.donor_id
              AND i.status = 'matching'
        )
        AND EXISTS (
            SELECT 1 FROM public.requests r
            WHERE r.id = appointments.request_id
              AND r.item_id = appointments.item_id
              AND r.requester_id = appointments.requester_id
              AND r.status = 'selected'
        )
    )
);

-- 7.3. Chính sách UPDATE: Không dùng so sánh cột trùng tên trong WITH CHECK
CREATE POLICY "Appointments update restricted" ON public.appointments
FOR UPDATE USING (
    auth.role() = 'service_role'
    OR (
        auth.uid() IS NOT NULL AND (
            donor_id = (SELECT legacy_id FROM public.get_current_profile())
            OR requester_id = (SELECT legacy_id FROM public.get_current_profile())
            OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'station_staff', 'admin')
        )
    )
) WITH CHECK (
    auth.role() = 'service_role'
    OR (
        auth.uid() IS NOT NULL AND (
            (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'station_staff', 'admin')
            OR (
                (SELECT user_role FROM public.get_current_profile()) = 'student' 
                AND status IN ('scheduled', 'cancelled')
            )
        )
    )
);

-- 7.4. Trigger bảo vệ toàn vẹn Appointments và chặn sửa mã nhận/đổi người nhận/sửa kiểm định
CREATE OR REPLACE FUNCTION public.trg_protect_appointment_lifecycle()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF current_setting('role', true) = 'service_role' THEN RETURN NEW; END IF;

    -- KHÔNG CHO HỌC SINH THAY ĐỔI CÁC TRƯỜNG CỐ ĐỊNH CỦA LỊCH HẸN
    IF OLD.pickup_code IS DISTINCT FROM NEW.pickup_code THEN
        RAISE EXCEPTION 'Bảo mật: Không được phép thay đổi mã nhận đồ (pickup_code)!';
    END IF;
    IF OLD.requester_id IS DISTINCT FROM NEW.requester_id THEN
        RAISE EXCEPTION 'Bảo mật: Không được phép thay đổi người nhận (requester_id)!';
    END IF;
    IF OLD.donor_id IS DISTINCT FROM NEW.donor_id THEN
        RAISE EXCEPTION 'Bảo mật: Không được phép thay đổi người cho (donor_id)!';
    END IF;
    IF OLD.item_id IS DISTINCT FROM NEW.item_id THEN
        RAISE EXCEPTION 'Bảo mật: Không được phép thay đổi món đồ (item_id)!';
    END IF;

    -- CHẶN TỰ Ý THAY ĐỔI Ô KỆ HOẶC THỜI ĐIỂM BÀN GIAO NẾU KHÔNG PHẢI CÁN BỘ TRẠM
    IF OLD.storage_slot IS DISTINCT FROM NEW.storage_slot THEN
        IF (SELECT user_role FROM public.get_current_profile()) NOT IN ('station_staff', 'teacher', 'admin') THEN
            RAISE EXCEPTION 'Từ chối quyền: Học sinh không được phép tự ý thay đổi ô kệ lưu trữ!';
        END IF;
    END IF;
    IF OLD.picked_up_at IS DISTINCT FROM NEW.picked_up_at THEN
        IF (SELECT user_role FROM public.get_current_profile()) NOT IN ('station_staff', 'teacher', 'admin') THEN
            RAISE EXCEPTION 'Từ chối quyền: Không được phép tự ý thay đổi thời điểm bàn giao!';
        END IF;
    END IF;

    -- CHẶN CHUYỂN SANG READY_FOR_PICKUP HOẶC FAILED_INSPECTION BỎ QUA RPC KIỂM ĐỊNH
    IF NEW.status IN ('ready_for_pickup', 'failed_inspection') AND OLD.status != NEW.status THEN
        IF COALESCE(current_setting('leloiloop.authorized_rpc', true), '') != 'true' THEN
            RAISE EXCEPTION 'Bảo mật: Trạng thái kiểm định lịch hẹn chỉ được cập nhật thông qua rpc_inspect_and_receive_item!';
        END IF;
    END IF;

    -- CHẶN CHUYỂN SANG COMPLETED BỎ QUA RPC BÀN GIAO
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        IF COALESCE(current_setting('leloiloop.authorized_rpc', true), '') != 'true' THEN
            RAISE EXCEPTION 'Bảo mật: Trạng thái hoàn tất bàn giao chỉ được cập nhật thông qua rpc_complete_handover!';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_appointment_lifecycle
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.trg_protect_appointment_lifecycle();

-- 7.5. Partial Unique Index chống trùng lặp mã nhận đang có hiệu lực
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_pickup_code 
ON public.appointments(UPPER(pickup_code)) 
WHERE (status IN ('scheduled', 'ready_for_pickup'));

-- 7.6. RPC cấp quyền an toàn cho NGƯỜI CHO xem lịch gửi đồ mà KHÔNG LỘ MÃ NHẬN
CREATE OR REPLACE FUNCTION public.rpc_get_my_dropoff_schedules()
RETURNS TABLE (
    id TEXT,
    item_id TEXT,
    request_id TEXT,
    donor_id TEXT,
    requester_id TEXT,
    status TEXT,
    type TEXT,
    donor_slot TEXT,
    requester_slot TEXT,
    pickup_code TEXT,
    storage_slot TEXT,
    notes TEXT,
    donor_arrived_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth, pg_temp AS $$
    SELECT 
        a.id,
        a.item_id,
        a.request_id,
        a.donor_id,
        a.requester_id,
        a.status,
        a.type,
        a.donor_slot,
        a.requester_slot,
        '***'::TEXT AS pickup_code, -- MÃ NHẬN ĐƯỢC ẨN AN TOÀN ĐỐI VỚI NGƯỜI CHO
        a.storage_slot,
        a.notes,
        a.donor_arrived_at,
        a.picked_up_at,
        a.created_at
    FROM public.appointments a
    WHERE a.donor_id = (SELECT legacy_id FROM public.get_current_profile())
      AND a.donor_id != a.requester_id;
$$;

REVOKE EXECUTE ON FUNCTION public.rpc_get_my_dropoff_schedules() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_get_my_dropoff_schedules() TO authenticated, service_role;

-- =========================================================================
-- BƯỚC 8: BẢO VỆ BẢNG NOTIFICATIONS (ĐỊNH DANH SERVER, CHỐNG MẠO DANH VÀ BẢO VỆ READ STATUS)
-- Thay cơ chế lọc từ khóa sender_name bằng cưỡng chế định danh từ Profile server
-- =========================================================================

CREATE POLICY "Users can only read own notifications" ON public.notifications
FOR SELECT USING (
    auth.role() = 'service_role'
    OR (
        auth.uid() IS NOT NULL 
        AND recipient_id = (SELECT legacy_id FROM public.get_current_profile())
    )
);

CREATE POLICY "Notifications insert strictly checked" ON public.notifications
FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
    OR auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update own notifications read status" ON public.notifications
FOR UPDATE USING (
    auth.role() = 'service_role'
    OR (
        auth.uid() IS NOT NULL 
        AND recipient_id = (SELECT legacy_id FROM public.get_current_profile())
    )
) WITH CHECK (
    auth.role() = 'service_role'
    OR (
        auth.uid() IS NOT NULL 
        AND recipient_id = (SELECT legacy_id FROM public.get_current_profile())
    )
);

-- Trigger cưỡng chế định danh người gửi và liên kết sự kiện thực tế
CREATE OR REPLACE FUNCTION public.trg_enforce_notification_sender()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp AS $$
DECLARE
    v_prof RECORD;
BEGIN
    IF current_setting('role', true) = 'service_role' THEN RETURN NEW; END IF;

    SELECT legacy_id, user_role, name INTO v_prof FROM public.get_current_profile();
    IF v_prof.legacy_id IS NULL THEN
        RAISE EXCEPTION 'Chưa đăng nhập! Yêu cầu xác thực tài khoản hợp lệ.';
    END IF;

    -- Cưỡng chế người gửi luôn là chính người đang đăng nhập
    NEW.sender_id := v_prof.legacy_id;

    -- Nếu là học sinh: Cưỡng chế lấy tên thật trong Profile; cấm mọi hành vi mạo danh
    IF v_prof.user_role = 'student' THEN
        NEW.sender_name := v_prof.name;

        -- Học sinh chỉ được phép gửi thông báo loại 'new_request'
        IF NEW.type != 'new_request' THEN
            RAISE EXCEPTION 'Học sinh chỉ được phép gửi thông báo loại yêu cầu xin đồ (new_request)!';
        END IF;

        IF NEW.item_id IS NULL THEN
            RAISE EXCEPTION 'Thông báo yêu cầu bắt buộc phải gắn liền với mã món đồ (item_id)!';
        END IF;

        -- Người nhận thông báo bắt buộc phải là người cho của món đồ này
        IF NOT EXISTS (
            SELECT 1 FROM public.items 
            WHERE id = NEW.item_id AND donor_id = NEW.recipient_id
        ) THEN
            RAISE EXCEPTION 'Người nhận thông báo không phải là người cho của món đồ được yêu cầu!';
        END IF;

        -- Người gửi bắt buộc phải thực sự có một yêu cầu nhận đồ (request) cho món này
        IF NOT EXISTS (
            SELECT 1 FROM public.requests 
            WHERE item_id = NEW.item_id AND requester_id = v_prof.legacy_id
        ) THEN
            RAISE EXCEPTION 'Bạn chỉ có thể gửi thông báo khi đã tạo yêu cầu nhận đồ hợp lệ!';
        END IF;
    ELSE
        -- Nếu là cán bộ trường: Mặc định lấy tên hồ sơ nếu client không điền
        NEW.sender_name := COALESCE(NEW.sender_name, v_prof.name);
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_notification_sender
BEFORE INSERT ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.trg_enforce_notification_sender();

-- Trigger khóa cứng chỉ cho phép sửa cột is_read khi UPDATE notifications
CREATE OR REPLACE FUNCTION public.trg_protect_notification_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF current_setting('role', true) = 'service_role' THEN RETURN NEW; END IF;

    IF OLD.id != NEW.id 
       OR OLD.recipient_id != NEW.recipient_id 
       OR OLD.sender_id IS DISTINCT FROM NEW.sender_id 
       OR OLD.sender_name IS DISTINCT FROM NEW.sender_name 
       OR OLD.type != NEW.type 
       OR OLD.title != NEW.title 
       OR OLD.message != NEW.message 
       OR OLD.item_id IS DISTINCT FROM NEW.item_id 
       OR OLD.request_id IS DISTINCT FROM NEW.request_id 
       OR OLD.created_at != NEW.created_at THEN
        RAISE EXCEPTION 'Từ chối: Bạn chỉ được phép đánh dấu đã đọc (is_read), không được sửa đổi nội dung thông báo!';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_notification
BEFORE UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.trg_protect_notification_update();

-- =========================================================================
-- BƯỚC 9: BẢO VỆ BẢNG LOGS (NHẬT KÝ KIỂM TOÁN HỆ THỐNG TOÀN VẸN)
-- =========================================================================
CREATE POLICY "Only staff view audit logs" ON public.logs
FOR SELECT USING (
    auth.role() = 'service_role'
    OR (
        auth.uid() IS NOT NULL AND 
        (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'station_staff', 'admin')
    )
);

CREATE POLICY "Only staff and service_role insert logs" ON public.logs
FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
    OR (
        auth.uid() IS NOT NULL AND 
        (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'station_staff', 'admin')
    )
);

-- =========================================================================
-- BƯỚC 10: BẢO VỆ Ô KỆ TRẠM & PHÂN CÔNG LƯU TRỮ (STATION_SLOTS & STORAGE_ASSIGNMENTS)
-- Chặn cập nhật trực tiếp bỏ qua RPC kiểm định và bàn giao
-- =========================================================================
CREATE POLICY "Public view station slots directory" ON public.station_slots
FOR SELECT USING (true);

CREATE POLICY "Only staff manage station slots" ON public.station_slots
FOR ALL USING (
    auth.role() = 'service_role'
    OR (
        auth.uid() IS NOT NULL AND 
        (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'station_staff', 'admin')
    )
);

CREATE POLICY "Only staff view storage assignments" ON public.storage_assignments
FOR SELECT USING (
    auth.role() = 'service_role'
    OR (
        auth.uid() IS NOT NULL AND 
        (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'station_staff', 'admin')
    )
);

-- Trigger chặn thao tác trực tiếp vào storage_assignments nếu không thông qua RPC
CREATE OR REPLACE FUNCTION public.trg_protect_storage_assignments()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF current_setting('role', true) = 'service_role' THEN RETURN NEW; END IF;

    IF COALESCE(current_setting('leloiloop.authorized_rpc', true), '') != 'true' THEN
        RAISE EXCEPTION 'Bảo mật: Việc phân công hoặc giải phóng ô kệ trạm (storage_assignments) bắt buộc phải thực hiện thông qua RPC kiểm định hoặc bàn giao!';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_storage_assignments
BEFORE INSERT OR UPDATE ON public.storage_assignments
FOR EACH ROW EXECUTE FUNCTION public.trg_protect_storage_assignments();

-- Ràng buộc Partial Unique Index: Một ô kệ chỉ có duy nhất 1 món ở trạng thái occupied
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_item_per_slot 
ON public.storage_assignments(slot_id) WHERE (status = 'occupied');

-- =========================================================================
-- BƯỚC 11: NÂNG CẤP CÁC RPC GIAO DỊCH NGUYÊN TỬ (TRANSACTIONAL RPCs)
-- Sử dụng session flag 'leloiloop.authorized_rpc' để cấp phép hợp lệ qua trigger
-- =========================================================================

-- 11.1. RPC: Chấp thuận yêu cầu (rpc_accept_request_by_donor)
CREATE OR REPLACE FUNCTION public.rpc_accept_request_by_donor(p_request_id TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp AS $$
DECLARE
    v_auth_uid UUID := auth.uid();
    v_caller_legacy_id TEXT;
    v_caller_role TEXT;
    v_caller_name TEXT;
    v_req RECORD;
    v_item RECORD;
BEGIN
    IF v_auth_uid IS NULL THEN
        RAISE EXCEPTION 'Chưa đăng nhập! Yêu cầu xác thực tài khoản hợp lệ.';
    END IF;

    SELECT legacy_id, user_role, name INTO v_caller_legacy_id, v_caller_role, v_caller_name
    FROM public.get_current_profile();

    IF v_caller_legacy_id IS NULL THEN
        v_caller_legacy_id := v_auth_uid::text;
        SELECT role, name INTO v_caller_role, v_caller_name FROM public.users WHERE id = v_caller_legacy_id;
    END IF;

    SELECT * INTO v_req FROM public.requests WHERE id = p_request_id FOR UPDATE;
    IF NOT FOUND THEN 
        RAISE EXCEPTION 'Không tìm thấy yêu cầu nhận đồ (ID: %)!', p_request_id; 
    END IF;

    IF v_req.status != 'pending' THEN
        RAISE EXCEPTION 'Yêu cầu không ở trạng thái hợp lệ để chấp thuận (Trạng thái hiện tại: %)! Chỉ có thể duyệt yêu cầu đang chờ.', v_req.status;
    END IF;

    SELECT * INTO v_item FROM public.items WHERE id = v_req.item_id FOR UPDATE;
    IF NOT FOUND THEN 
        RAISE EXCEPTION 'Không tìm thấy món đồ tương ứng (ID: %)!', v_req.item_id; 
    END IF;

    IF v_item.status NOT IN ('approved', 'matching') THEN
        RAISE EXCEPTION 'Món đồ hiện không ở trạng thái được phép duyệt yêu cầu (Trạng thái: %)!', v_item.status;
    END IF;

    IF EXISTS (SELECT 1 FROM public.requests WHERE item_id = v_item.id AND status = 'selected') THEN
        RAISE EXCEPTION 'Món đồ này đã có người nhận chính thức được chọn trước đó, không thể chọn thêm!';
    END IF;

    IF v_item.donor_id != v_caller_legacy_id AND v_caller_role NOT IN ('teacher', 'admin') THEN
        RAISE EXCEPTION 'Từ chối quyền: Bạn không phải là người đăng món đồ này!';
    END IF;

    -- Bật cờ cho phép trigger cập nhật trạng thái quan trọng
    PERFORM set_config('leloiloop.authorized_rpc', 'true', true);

    UPDATE public.requests SET status = 'selected', lottery_rank = 1 WHERE id = p_request_id;
    UPDATE public.requests SET status = 'backup', lottery_rank = 2 WHERE item_id = v_item.id AND id != p_request_id AND status = 'pending';
    UPDATE public.items SET status = 'matching', request_status = 'closed' WHERE id = v_item.id;

    INSERT INTO public.notifications (
        recipient_id, sender_id, sender_name, type, title, message, item_id, request_id
    ) VALUES (
        v_req.requester_id, v_caller_legacy_id, COALESCE(v_caller_name, 'Người tặng'),
        'request_accepted', 'Yêu cầu được chấp thuận! 🎉',
        'Món đồ "' || v_item.title || '" đã được đồng ý trao cho bạn. Vui lòng theo dõi lịch hẹn!', v_item.id, v_req.id
    );

    INSERT INTO public.logs (id, timestamp, role, action, details)
    VALUES ('LOG-' || SUBSTRING(gen_random_uuid()::text, 1, 8), NOW(), COALESCE(v_caller_name, v_caller_legacy_id), 'CHẤP THUẬN YÊU CẦU (RPC)', 'Duyệt yêu cầu ' || p_request_id || ' cho món ' || v_item.id);

    RETURN jsonb_build_object('success', true, 'item_id', v_item.id, 'request_id', p_request_id, 'winner_id', v_req.requester_id);
END;
$$;

-- 11.2. RPC: Tiếp nhận & Kiểm định chất lượng tại trạm (rpc_inspect_and_receive_item)
CREATE OR REPLACE FUNCTION public.rpc_inspect_and_receive_item(
    p_apt_id TEXT, p_passed BOOLEAN, p_note TEXT, p_storage_slot TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp AS $$
DECLARE
    v_auth_uid UUID := auth.uid();
    v_caller_legacy_id TEXT;
    v_caller_role TEXT;
    v_caller_name TEXT;
    v_apt RECORD;
    v_item RECORD;
    v_slot_occupied BOOLEAN;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    IF v_auth_uid IS NULL THEN RAISE EXCEPTION 'Chưa đăng nhập! Yêu cầu xác thực tài khoản hợp lệ.'; END IF;

    SELECT legacy_id, user_role, name INTO v_caller_legacy_id, v_caller_role, v_caller_name
    FROM public.get_current_profile();

    IF v_caller_legacy_id IS NULL THEN
        v_caller_legacy_id := v_auth_uid::text;
        SELECT role, name INTO v_caller_role, v_caller_name FROM public.users WHERE id = v_caller_legacy_id;
    END IF;

    IF v_caller_role NOT IN ('station_staff', 'teacher', 'admin') THEN
        RAISE EXCEPTION 'Từ chối quyền: Chỉ Quản sinh Trạm Phòng Đội hoặc Giáo viên mới có quyền tiếp nhận đồ!';
    END IF;

    SELECT * INTO v_apt FROM public.appointments WHERE id = p_apt_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy lịch hẹn tiếp nhận (ID: %)!', p_apt_id; END IF;

    IF v_apt.status != 'scheduled' THEN
        RAISE EXCEPTION 'Lịch hẹn không ở trạng thái chờ tiếp nhận (Trạng thái hiện tại: %)!', v_apt.status;
    END IF;

    SELECT * INTO v_item FROM public.items WHERE id = v_apt.item_id FOR UPDATE;

    -- Bật cờ phiên giao dịch để trigger cho phép cập nhật trạng thái quan trọng
    PERFORM set_config('leloiloop.authorized_rpc', 'true', true);

    IF p_passed THEN
        IF v_apt.type != 'direct' THEN
            IF p_storage_slot IS NULL OR TRIM(p_storage_slot) = '' THEN 
                RAISE EXCEPTION 'Vui lòng chọn ô kệ lưu trữ tại trạm!'; 
            END IF;

            IF p_storage_slot NOT IN ('K1-A1', 'K1-A2', 'K1-A3', 'K1-A4', 'K1-A5', 'K1-B1', 'K1-B2', 'K1-B3', 'K1-B4', 'K1-B5') THEN
                RAISE EXCEPTION 'Ô kệ % không hợp lệ! Trạm K1 chỉ có 10 ô từ K1-A1 đến K1-B5.', p_storage_slot;
            END IF;

            SELECT EXISTS (
                SELECT 1 FROM public.items 
                WHERE storage_slot = p_storage_slot AND status = 'stored' AND id != v_item.id
            ) INTO v_slot_occupied;

            IF v_slot_occupied THEN 
                RAISE EXCEPTION 'Ô kệ % hiện đã có đồ lưu trữ! Vui lòng chọn ô khác.', p_storage_slot; 
            END IF;

            INSERT INTO public.storage_assignments (slot_id, item_id, appointment_id, assigned_by, status, occupied_at, notes)
            VALUES (p_storage_slot, v_item.id, v_apt.id, v_caller_legacy_id, 'occupied', v_now, p_note);
        END IF;

        UPDATE public.appointments 
        SET status = 'ready_for_pickup',
            donor_arrived_at = v_now,
            storage_slot = CASE WHEN v_apt.type = 'direct' THEN NULL ELSE p_storage_slot END,
            notes = COALESCE(notes, '') || ' [Đạt kiểm tra: ' || COALESCE(p_note, 'Tốt') || ' - Cán bộ: ' || COALESCE(v_caller_name, v_caller_legacy_id) || ']'
        WHERE id = p_apt_id;

        UPDATE public.items 
        SET status = CASE WHEN v_apt.type = 'direct' THEN 'matching' ELSE 'stored' END,
            storage_slot = CASE WHEN v_apt.type = 'direct' THEN NULL ELSE p_storage_slot END,
            quality_check = jsonb_build_object('passed', true, 'note', p_note, 'checkedBy', v_caller_legacy_id)
        WHERE id = v_item.id;

        -- Gửi thông báo kèm mã nhận đồ DUY NHẤT cho người nhận (Requester)
        INSERT INTO public.notifications (recipient_id, sender_id, sender_name, type, title, message, item_id)
        VALUES (
            v_apt.requester_id, v_caller_legacy_id, 'Quản sinh Trạm Lê Lợi', 'item_ready', 
            'Đồ dùng đã sẵn sàng nhận tại Phòng Đội! 📦', 
            'Món đồ "' || v_item.title || '" đã được bàn giao tại Phòng Đội. Mã nhận: ' || v_apt.pickup_code, 
            v_item.id
        );

        INSERT INTO public.logs (id, timestamp, role, action, details)
        VALUES ('LOG-' || SUBSTRING(gen_random_uuid()::text, 1, 8), v_now, COALESCE(v_caller_name, v_caller_legacy_id), 'KIỂM ĐỊNH ĐẠT (RPC)', 'Tiếp nhận món ' || v_item.id || ' vào ô ' || COALESCE(p_storage_slot, 'Trực tiếp'));

        RETURN jsonb_build_object('success', true, 'status', 'ready_for_pickup', 'slot', p_storage_slot);
    ELSE
        UPDATE public.appointments SET status = 'failed_inspection', notes = COALESCE(notes, '') || ' [Không đạt: ' || COALESCE(p_note, 'Không rõ lý do') || ']' WHERE id = p_apt_id;
        UPDATE public.items SET status = 'rejected', reject_reason = 'Không đạt kiểm tra: ' || COALESCE(p_note, 'Không rõ lý do'), quality_check = jsonb_build_object('passed', false, 'note', p_note, 'checkedBy', v_caller_legacy_id) WHERE id = v_item.id;
        
        INSERT INTO public.logs (id, timestamp, role, action, details)
        VALUES ('LOG-' || SUBSTRING(gen_random_uuid()::text, 1, 8), v_now, COALESCE(v_caller_name, v_caller_legacy_id), 'KIỂM ĐỊNH KHÔNG ĐẠT (RPC)', 'Món ' || v_item.id || ' không đạt: ' || COALESCE(p_note, 'Lý do khác'));

        RETURN jsonb_build_object('success', true, 'status', 'failed_inspection');
    END IF;
END;
$$;

-- 11.3. RPC: Hoàn tất bàn giao đồ (rpc_complete_handover)
-- Bắt buộc đối chiếu p_expected_requester_id, không chấp nhận NULL hoặc chuỗi rỗng
CREATE OR REPLACE FUNCTION public.rpc_complete_handover(
    p_pickup_code TEXT,
    p_expected_requester_id TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp AS $$
DECLARE
    v_auth_uid UUID := auth.uid();
    v_caller_legacy_id TEXT;
    v_caller_role TEXT;
    v_caller_name TEXT;
    v_code TEXT := UPPER(TRIM(p_pickup_code));
    v_req_id TEXT := TRIM(COALESCE(p_expected_requester_id, ''));
    v_apt RECORD;
    v_item RECORD;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    IF v_auth_uid IS NULL THEN RAISE EXCEPTION 'Chưa đăng nhập! Yêu cầu xác thực tài khoản hợp lệ.'; END IF;

    -- Bắt buộc đối chiếu mã học sinh nhận đồ, cấm hoàn toàn NULL hoặc chuỗi rỗng
    IF v_req_id = '' THEN
        RAISE EXCEPTION 'Bảo mật: Bắt buộc cung cấp mã định danh học sinh đến nhận (p_expected_requester_id) để đối chiếu danh tính!';
    END IF;

    SELECT legacy_id, user_role, name INTO v_caller_legacy_id, v_caller_role, v_caller_name
    FROM public.get_current_profile();

    IF v_caller_legacy_id IS NULL THEN
        v_caller_legacy_id := v_auth_uid::text;
        SELECT role, name INTO v_caller_role, v_caller_name FROM public.users WHERE id = v_caller_legacy_id;
    END IF;

    IF v_caller_role NOT IN ('station_staff', 'teacher', 'admin') THEN
        RAISE EXCEPTION 'Từ chối quyền: Chỉ Quản sinh Trạm Phòng Đội mới có quyền xác nhận bàn giao đồ!';
    END IF;

    -- Tra cứu lịch hẹn đang ở trạng thái ready_for_pickup
    SELECT * INTO v_apt 
    FROM public.appointments 
    WHERE UPPER(pickup_code) = v_code 
      AND status = 'ready_for_pickup'
    ORDER BY created_at DESC 
    LIMIT 1 
    FOR UPDATE;

    IF NOT FOUND THEN 
        IF EXISTS (SELECT 1 FROM public.appointments WHERE UPPER(pickup_code) = v_code AND status = 'completed') THEN 
            RAISE EXCEPTION 'Mã nhận đồ này ĐÃ ĐƯỢC BÀN GIAO trước đó và đã bị vô hiệu hóa an toàn!'; 
        ELSIF EXISTS (SELECT 1 FROM public.appointments WHERE UPPER(pickup_code) = v_code AND status = 'scheduled') THEN
            RAISE EXCEPTION 'Món đồ tương ứng với mã nhận này CHƯA QUA KHÂU KIỂM ĐỊNH tại trạm, chưa thể bàn giao!';
        ELSIF EXISTS (SELECT 1 FROM public.appointments WHERE UPPER(pickup_code) = v_code AND status IN ('cancelled', 'failed_inspection')) THEN
            RAISE EXCEPTION 'Lịch hẹn tương ứng với mã nhận đồ này đã bị hủy hoặc không đạt kiểm định!';
        ELSE
            RAISE EXCEPTION 'Mã nhận đồ không tồn tại trong hệ thống!'; 
        END IF;
    END IF;

    -- Đối chiếu danh tính bắt buộc: Người đến nhận phải khớp hồ sơ đặt hẹn
    IF v_apt.requester_id != v_req_id THEN
        RAISE EXCEPTION 'Xác minh thất bại: Học sinh đến nhận (%) không khớp với người nhận trong hồ sơ đặt hẹn (%)!', v_req_id, v_apt.requester_id;
    END IF;

    SELECT * INTO v_item FROM public.items WHERE id = v_apt.item_id FOR UPDATE;

    -- Kiểm định chất lượng thực tế bắt buộc phải đạt cho cả 2 hình thức
    IF NOT COALESCE((v_item.quality_check->>'passed')::boolean, false) THEN
        RAISE EXCEPTION 'Món đồ chưa qua kiểm tra chất lượng thực tế đạt yêu cầu!';
    END IF;

    -- Bật cờ cho phép trigger cập nhật trạng thái quan trọng
    PERFORM set_config('leloiloop.authorized_rpc', 'true', true);

    UPDATE public.appointments 
    SET status = 'completed', picked_up_at = v_now, storage_slot = NULL 
    WHERE id = v_apt.id;

    UPDATE public.items 
    SET status = 'completed', storage_slot = NULL 
    WHERE id = v_item.id;

    UPDATE public.storage_assignments 
    SET status = 'released', released_at = v_now 
    WHERE appointment_id = v_apt.id AND status = 'occupied';

    INSERT INTO public.logs (id, timestamp, role, action, details)
    VALUES ('LOG-' || SUBSTRING(gen_random_uuid()::text, 1, 8), v_now, COALESCE(v_caller_name, v_caller_legacy_id), 'BÀN GIAO THÀNH CÔNG (RPC)', 'Hoàn tất bàn giao món ' || v_item.id || ' cho học sinh ' || v_apt.requester_id || ' (' || v_apt.type || ')');

    RETURN jsonb_build_object(
        'success', true, 
        'item_title', v_item.title, 
        'requester_id', v_apt.requester_id, 
        'pickup_code', v_apt.pickup_code, 
        'completed_at', v_now
    );
END;
$$;

-- 11.4. RPC: Hủy lịch hẹn an toàn (rpc_cancel_appointment)
CREATE OR REPLACE FUNCTION public.rpc_cancel_appointment(
    p_appointment_id TEXT,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp AS $$
DECLARE
    v_auth_uid UUID := auth.uid();
    v_caller_legacy_id TEXT;
    v_caller_role TEXT;
    v_caller_name TEXT;
    v_apt RECORD;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    IF v_auth_uid IS NULL THEN RAISE EXCEPTION 'Chưa đăng nhập! Yêu cầu xác thực tài khoản hợp lệ.'; END IF;

    SELECT legacy_id, user_role, name INTO v_caller_legacy_id, v_caller_role, v_caller_name
    FROM public.get_current_profile();

    SELECT * INTO v_apt FROM public.appointments WHERE id = p_appointment_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy lịch hẹn (ID: %)!', p_appointment_id; END IF;

    -- Kiểm tra quyền: Người cho, người nhận hoặc cán bộ
    IF v_caller_role NOT IN ('teacher', 'station_staff', 'admin')
       AND v_apt.donor_id != v_caller_legacy_id 
       AND v_apt.requester_id != v_caller_legacy_id THEN
        RAISE EXCEPTION 'Từ chối quyền: Bạn không có quyền hủy lịch hẹn này!';
    END IF;

    IF v_apt.status IN ('completed', 'cancelled') THEN
        RAISE EXCEPTION 'Lịch hẹn đã hoàn thành hoặc đã bị hủy trước đó!';
    END IF;

    -- Bật cờ cho phép trigger cập nhật trạng thái
    PERFORM set_config('leloiloop.authorized_rpc', 'true', true);

    UPDATE public.appointments 
    SET status = 'cancelled',
        notes = COALESCE(notes, '') || ' [Đã hủy: ' || COALESCE(p_reason, 'Người dùng hủy') || ']'
    WHERE id = p_appointment_id;

    -- Giải phóng ô kệ nếu có
    UPDATE public.storage_assignments 
    SET status = 'released', released_at = v_now 
    WHERE appointment_id = p_appointment_id AND status = 'occupied';

    -- Khôi phục món đồ về approved và mở nhận yêu cầu
    UPDATE public.items 
    SET status = 'approved', request_status = 'open', storage_slot = NULL 
    WHERE id = v_apt.item_id;

    -- Khôi phục yêu cầu được chọn về pending
    UPDATE public.requests 
    SET status = 'pending', lottery_rank = NULL 
    WHERE id = v_apt.request_id AND status = 'selected';

    INSERT INTO public.logs (id, timestamp, role, action, details)
    VALUES ('LOG-' || SUBSTRING(gen_random_uuid()::text, 1, 8), v_now, COALESCE(v_caller_name, v_caller_legacy_id), 'HỦY LỊCH HẸN (RPC)', 'Hủy lịch ' || p_appointment_id || '. Lý do: ' || COALESCE(p_reason, 'Không rõ'));

    RETURN jsonb_build_object('success', true, 'appointment_id', p_appointment_id);
END;
$$;

-- 11.5. RPC: Đổi lịch hẹn an toàn (rpc_reschedule_appointment)
CREATE OR REPLACE FUNCTION public.rpc_reschedule_appointment(
    p_appointment_id TEXT,
    p_donor_slot TEXT,
    p_requester_slot TEXT,
    p_type TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp AS $$
DECLARE
    v_auth_uid UUID := auth.uid();
    v_caller_legacy_id TEXT;
    v_caller_role TEXT;
    v_caller_name TEXT;
    v_apt RECORD;
BEGIN
    IF v_auth_uid IS NULL THEN RAISE EXCEPTION 'Chưa đăng nhập! Yêu cầu xác thực tài khoản hợp lệ.'; END IF;

    SELECT legacy_id, user_role, name INTO v_caller_legacy_id, v_caller_role, v_caller_name
    FROM public.get_current_profile();

    SELECT * INTO v_apt FROM public.appointments WHERE id = p_appointment_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy lịch hẹn (ID: %)!', p_appointment_id; END IF;

    IF v_caller_role NOT IN ('teacher', 'station_staff', 'admin')
       AND v_apt.donor_id != v_caller_legacy_id 
       AND v_apt.requester_id != v_caller_legacy_id THEN
        RAISE EXCEPTION 'Từ chối quyền: Bạn không có quyền đổi lịch hẹn này!';
    END IF;

    IF v_apt.status != 'scheduled' THEN
        RAISE EXCEPTION 'Chỉ có thể đổi lịch khi lịch hẹn đang ở trạng thái đã xếp lịch (scheduled)!';
    END IF;

    IF p_type NOT IN ('direct', 'temporary_storage') THEN
        RAISE EXCEPTION 'Hình thức trao nhận % không hợp lệ!', p_type;
    END IF;

    -- Bật cờ cho phép trigger cập nhật
    PERFORM set_config('leloiloop.authorized_rpc', 'true', true);

    UPDATE public.appointments 
    SET donor_slot = p_donor_slot,
        requester_slot = p_requester_slot,
        type = p_type,
        notes = COALESCE(notes, '') || ' [Đã đổi lịch hẹn]'
    WHERE id = p_appointment_id;

    INSERT INTO public.logs (id, timestamp, role, action, details)
    VALUES ('LOG-' || SUBSTRING(gen_random_uuid()::text, 1, 8), NOW(), COALESCE(v_caller_name, v_caller_legacy_id), 'ĐỔI LỊCH HẸN (RPC)', 'Đổi ca hẹn cho mã ' || p_appointment_id);

    RETURN jsonb_build_object('success', true, 'appointment_id', p_appointment_id);
END;
$$;

-- =========================================================================
-- BƯỚC 12: CẤP QUYỀN EXECUTE CHUYÊN TRÁCH CHO RPC
-- =========================================================================
REVOKE EXECUTE ON FUNCTION public.rpc_accept_request_by_donor(TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.rpc_inspect_and_receive_item(TEXT, BOOLEAN, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.rpc_complete_handover(TEXT, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.rpc_cancel_appointment(TEXT, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.rpc_reschedule_appointment(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.rpc_get_my_dropoff_schedules() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.rpc_accept_request_by_donor(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_inspect_and_receive_item(TEXT, BOOLEAN, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_complete_handover(TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_cancel_appointment(TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_reschedule_appointment(TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_get_my_dropoff_schedules() TO authenticated, service_role;
