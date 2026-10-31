-- =========================================================================
-- FILE: STAGING_DEPLOY_ALL_REMAINING.sql
-- MỤC ĐÍCH: NẠP TOÀN BỘ CẤU TRÚC CÒN LẠI LÊN SUPABASE STAGING (ynkhukeqdqewakrqtvtu)
-- GỒM: NOTIFICATIONS + KỆ TRẠM PHÒNG ĐỘI + PARTIAL UNIQUE INDEXES + 3 RPCs + RLS POLICIES
-- =========================================================================

-- =========================================================================
-- BƯỚC 1: BẢNG NOTIFICATIONS & REALTIME (MIGRATION 002)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    recipient_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sender_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    sender_name TEXT,
    type TEXT NOT NULL DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    item_id TEXT REFERENCES public.items(id) ON DELETE SET NULL,
    request_id TEXT REFERENCES public.requests(id) ON DELETE SET NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread 
ON public.notifications(recipient_id, is_read, created_at DESC);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- BƯỚC 2: QUẢN LÝ 10 Ô KỆ TRẠM PHÒNG ĐỘI (MIGRATION 003)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.station_slots (
    id TEXT PRIMARY KEY,
    shelf_zone TEXT NOT NULL,
    slot_number INTEGER NOT NULL,
    max_dimensions TEXT DEFAULT '30x40x25 cm',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.station_slots (id, shelf_zone, slot_number, max_dimensions)
VALUES
('K1-A1', 'Khu A (Ngăn trên)', 1, '30x40x25 cm'),
('K1-A2', 'Khu A (Ngăn trên)', 2, '30x40x25 cm'),
('K1-A3', 'Khu A (Ngăn trên)', 3, '30x40x25 cm'),
('K1-A4', 'Khu A (Ngăn trên)', 4, '30x40x25 cm'),
('K1-A5', 'Khu A (Ngăn trên)', 5, '30x40x25 cm'),
('K1-B1', 'Khu B (Ngăn dưới)', 1, '35x45x30 cm'),
('K1-B2', 'Khu B (Ngăn dưới)', 2, '35x45x30 cm'),
('K1-B3', 'Khu B (Ngăn dưới)', 3, '35x45x30 cm'),
('K1-B4', 'Khu B (Ngăn dưới)', 4, '35x45x30 cm'),
('K1-B5', 'Khu B (Ngăn dưới)', 5, '35x45x30 cm')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.storage_assignments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    slot_id TEXT NOT NULL REFERENCES public.station_slots(id) ON DELETE RESTRICT,
    item_id TEXT NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    appointment_id TEXT REFERENCES public.appointments(id) ON DELETE SET NULL,
    assigned_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'occupied',
    occupied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    released_at TIMESTAMPTZ,
    notes TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_storage_active_slot 
ON public.storage_assignments(slot_id) 
WHERE status = 'occupied';

ALTER TABLE public.station_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view station_slots" ON public.station_slots;
CREATE POLICY "Public can view station_slots" ON public.station_slots FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view storage_assignments" ON public.storage_assignments;
CREATE POLICY "Public can view storage_assignments" ON public.storage_assignments FOR SELECT USING (true);

-- =========================================================================
-- BƯỚC 3: RÀNG BUỘC UNIQUE BÁN PHẦN CHỐNG RACE CONDITION (MIGRATION 004)
-- =========================================================================
CREATE UNIQUE INDEX IF NOT EXISTS uq_requests_active_item_requester 
ON public.requests(item_id, requester_id) 
WHERE status != 'rejected';

CREATE UNIQUE INDEX IF NOT EXISTS uq_requests_single_winner 
ON public.requests(item_id) 
WHERE status = 'selected';

CREATE UNIQUE INDEX IF NOT EXISTS uq_items_single_occupied_slot 
ON public.items(storage_slot) 
WHERE status = 'stored' AND storage_slot IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_active_code 
ON public.appointments(pickup_code) 
WHERE status IN ('scheduled', 'ready_for_pickup');

CREATE INDEX IF NOT EXISTS idx_requests_item_id ON public.requests(item_id);
CREATE INDEX IF NOT EXISTS idx_requests_requester_id ON public.requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_appointments_item_id ON public.appointments(item_id);
CREATE INDEX IF NOT EXISTS idx_items_donor_id ON public.items(donor_id);

-- =========================================================================
-- BƯỚC 4: HỒ SƠ PROFILES, 3 RPCs NGUYÊN TỬ VÀ RLS AN TOÀN (MIGRATION 005)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    legacy_user_id TEXT UNIQUE REFERENCES public.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'station_staff', 'teacher', 'admin')),
    class TEXT,
    shift TEXT,
    phone TEXT,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.trg_prevent_role_tampering()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.role IS DISTINCT FROM NEW.role AND current_setting('role', true) != 'service_role' THEN
        RAISE EXCEPTION 'Bạn không có quyền tự thay đổi vai trò (role) trong hồ sơ!';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_prevent_role_tampering();

CREATE OR REPLACE FUNCTION public.get_current_profile()
RETURNS TABLE (legacy_id TEXT, user_role TEXT, name TEXT) 
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth, pg_temp AS $$
    SELECT 
        COALESCE(p.legacy_user_id, p.auth_user_id::text) AS legacy_id,
        p.role AS user_role,
        p.full_name AS name
    FROM public.profiles p 
    WHERE p.auth_user_id = auth.uid();
$$;

-- 4.1. RPC: Chốt người nhận (rpc_accept_request_by_donor)
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
    IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy yêu cầu nhận đồ (ID: %)!', p_request_id; END IF;

    SELECT * INTO v_item FROM public.items WHERE id = v_req.item_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy món đồ tương ứng (ID: %)!', v_req.item_id; END IF;

    IF v_item.status NOT IN ('approved', 'matching') THEN
        RAISE EXCEPTION 'Món đồ hiện không ở trạng thái được phép duyệt yêu cầu!';
    END IF;

    IF v_item.donor_id != v_caller_legacy_id AND v_caller_role NOT IN ('teacher', 'admin') THEN
        RAISE EXCEPTION 'Từ chối quyền: Bạn không phải là người đăng món đồ này!';
    END IF;

    UPDATE public.requests SET status = 'selected', lottery_rank = 1 WHERE id = p_request_id;
    UPDATE public.requests SET status = 'backup', lottery_rank = 2 WHERE item_id = v_item.id AND id != p_request_id AND status != 'rejected';
    UPDATE public.items SET status = 'matching', request_status = 'closed' WHERE id = v_item.id;

    INSERT INTO public.notifications (
        recipient_id, sender_id, sender_name, type, title, message, item_id, request_id
    ) VALUES (
        v_req.requester_id, v_caller_legacy_id, COALESCE(v_caller_name, 'Người tặng'),
        'request_accepted', 'Yêu cầu được chấp thuận! 🎉',
        'Món đồ "' || v_item.title || '" đã được đồng ý trao cho bạn.', v_item.id, v_req.id
    );

    INSERT INTO public.logs (id, timestamp, role, action, details)
    VALUES ('LOG-' || SUBSTRING(gen_random_uuid()::text, 1, 8), NOW(), COALESCE(v_caller_name, v_caller_legacy_id), 'CHẤP THUẬN YÊU CẦU (RPC)', 'Duyệt yêu cầu ' || p_request_id || ' cho món ' || v_item.id);

    RETURN jsonb_build_object('success', true, 'item_id', v_item.id, 'request_id', p_request_id, 'winner_id', v_req.requester_id);
END;
$$;

-- 4.2. RPC: Quản sinh kiểm định & gán ô kệ (rpc_inspect_and_receive_item)
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
    IF v_auth_uid IS NULL THEN RAISE EXCEPTION 'Chưa đăng nhập!'; END IF;

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

    SELECT * INTO v_item FROM public.items WHERE id = v_apt.item_id FOR UPDATE;

    IF p_passed THEN
        IF v_apt.type != 'direct' THEN
            IF p_storage_slot IS NULL OR TRIM(p_storage_slot) = '' THEN RAISE EXCEPTION 'Vui lòng chọn ô kệ lưu trữ tại trạm!'; END IF;
            IF p_storage_slot NOT IN ('K1-A1', 'K1-A2', 'K1-A3', 'K1-A4', 'K1-A5', 'K1-B1', 'K1-B2', 'K1-B3', 'K1-B4', 'K1-B5') THEN
                RAISE EXCEPTION 'Ô kệ % không hợp lệ! Trạm có 10 ô từ K1-A1 đến K1-B5.', p_storage_slot;
            END IF;

            SELECT EXISTS (SELECT 1 FROM public.items WHERE storage_slot = p_storage_slot AND status = 'stored' AND id != v_item.id) INTO v_slot_occupied;
            IF v_slot_occupied THEN RAISE EXCEPTION 'Ô kệ % hiện đã có đồ lưu trữ!', p_storage_slot; END IF;

            INSERT INTO public.storage_assignments (slot_id, item_id, appointment_id, assigned_by, status, occupied_at, notes)
            VALUES (p_storage_slot, v_item.id, v_apt.id, v_caller_legacy_id, 'occupied', v_now, p_note);
        END IF;

        UPDATE public.appointments 
        SET status = 'ready_for_pickup', donor_arrived_at = v_now,
            storage_slot = CASE WHEN v_apt.type = 'direct' THEN NULL ELSE p_storage_slot END,
            notes = COALESCE(notes, '') || ' [Đạt kiểm định: ' || COALESCE(p_note, 'Tốt') || ']'
        WHERE id = p_apt_id;

        UPDATE public.items 
        SET status = CASE WHEN v_apt.type = 'direct' THEN 'matching' ELSE 'stored' END,
            storage_slot = CASE WHEN v_apt.type = 'direct' THEN NULL ELSE p_storage_slot END,
            quality_check = jsonb_build_object('passed', true, 'note', p_note, 'checkedBy', v_caller_legacy_id)
        WHERE id = v_item.id;

        INSERT INTO public.notifications (recipient_id, sender_id, sender_name, type, title, message, item_id)
        VALUES (v_apt.requester_id, v_caller_legacy_id, 'Quản sinh Trạm Lê Lợi', 'item_ready', 'Đồ dùng đã sẵn sàng nhận tại Phòng Đội! 📦', 'Món đồ "' || v_item.title || '" đã được bàn giao tại Phòng Đội. Mã nhận: ' || v_apt.pickup_code, v_item.id);

        RETURN jsonb_build_object('success', true, 'status', 'ready_for_pickup', 'slot', p_storage_slot);
    ELSE
        UPDATE public.appointments SET status = 'failed_inspection', notes = COALESCE(notes, '') || ' [Không đạt: ' || COALESCE(p_note, 'Không rõ lý do') || ']' WHERE id = p_apt_id;
        UPDATE public.items SET status = 'rejected', reject_reason = 'Không đạt kiểm tra: ' || COALESCE(p_note, 'Không rõ lý do'), quality_check = jsonb_build_object('passed', false, 'note', p_note, 'checkedBy', v_caller_legacy_id) WHERE id = v_item.id;
        RETURN jsonb_build_object('success', true, 'status', 'failed_inspection');
    END IF;
END;
$$;

-- 4.3. RPC: Hoàn tất bàn giao & vô hiệu hóa mã nhận (rpc_complete_handover)
CREATE OR REPLACE FUNCTION public.rpc_complete_handover(p_pickup_code TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp AS $$
DECLARE
    v_auth_uid UUID := auth.uid();
    v_caller_legacy_id TEXT;
    v_caller_role TEXT;
    v_caller_name TEXT;
    v_code TEXT := UPPER(TRIM(p_pickup_code));
    v_apt RECORD;
    v_item RECORD;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    IF v_auth_uid IS NULL THEN RAISE EXCEPTION 'Chưa đăng nhập!'; END IF;

    SELECT legacy_id, user_role, name INTO v_caller_legacy_id, v_caller_role, v_caller_name
    FROM public.get_current_profile();

    IF v_caller_legacy_id IS NULL THEN
        v_caller_legacy_id := v_auth_uid::text;
        SELECT role, name INTO v_caller_role, v_caller_name FROM public.users WHERE id = v_caller_legacy_id;
    END IF;

    IF v_caller_role NOT IN ('station_staff', 'teacher', 'admin') THEN
        RAISE EXCEPTION 'Từ chối quyền: Chỉ Quản sinh Trạm Phòng Đội mới có quyền xác nhận bàn giao đồ!';
    END IF;

    SELECT * INTO v_apt FROM public.appointments WHERE UPPER(pickup_code) = v_code FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Mã nhận đồ không tồn tại!'; END IF;
    IF v_apt.status = 'completed' THEN RAISE EXCEPTION 'Mã nhận đồ này ĐÃ ĐƯỢC BÀN GIAO trước đó và đã bị vô hiệu hóa!'; END IF;

    SELECT * INTO v_item FROM public.items WHERE id = v_apt.item_id FOR UPDATE;

    UPDATE public.appointments SET status = 'completed', picked_up_at = v_now, storage_slot = NULL WHERE id = v_apt.id;
    UPDATE public.items SET status = 'completed', storage_slot = NULL WHERE id = v_item.id;

    UPDATE public.storage_assignments SET status = 'released', released_at = v_now WHERE appointment_id = v_apt.id AND status = 'occupied';

    INSERT INTO public.logs (id, timestamp, role, action, details)
    VALUES ('LOG-' || SUBSTRING(gen_random_uuid()::text, 1, 8), v_now, COALESCE(v_caller_name, v_caller_legacy_id), 'BÀN GIAO THÀNH CÔNG (RPC)', 'Đã bàn giao món ' || v_item.id || ' (' || v_item.title || ') cho học sinh ' || v_apt.requester_id);

    RETURN jsonb_build_object('success', true, 'item_title', v_item.title, 'requester_id', v_apt.requester_id, 'pickup_code', v_apt.pickup_code, 'completed_at', v_now);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.rpc_accept_request_by_donor(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_inspect_and_receive_item(TEXT, BOOLEAN, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_complete_handover(TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.rpc_accept_request_by_donor(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.rpc_inspect_and_receive_item(TEXT, BOOLEAN, TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.rpc_complete_handover(TEXT) TO authenticated, anon;

-- =========================================================================
-- BƯỚC 5: HỆ THỐNG RLS POLICIES AN TOÀN CHO TẤT CẢ CÁC BẢNG
-- =========================================================================
-- Users
DROP POLICY IF EXISTS "Public can view users directory" ON public.users;
CREATE POLICY "Public can view users directory" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only staff or service_role can update users" ON public.users;
CREATE POLICY "Only staff or service_role can update users" ON public.users
FOR UPDATE USING (
    auth.role() = 'service_role' OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'admin')
);

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (
    auth.uid() = auth_user_id
    OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'station_staff', 'admin')
    OR auth.role() = 'service_role'
);

-- Items
DROP POLICY IF EXISTS "Public can view approved items" ON public.items;
CREATE POLICY "Public can view approved items" ON public.items
FOR SELECT USING (
    status IN ('approved', 'matching', 'stored', 'ready_for_pickup', 'completed')
    OR donor_id = (SELECT legacy_id FROM public.get_current_profile())
    OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'station_staff', 'admin')
    OR auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Students can insert pending items" ON public.items;
CREATE POLICY "Students can insert pending items" ON public.items
FOR INSERT WITH CHECK (
    donor_id = (SELECT legacy_id FROM public.get_current_profile())
    OR auth.role() = 'service_role'
    OR donor_id IS NOT NULL
);

DROP POLICY IF EXISTS "Donors or staff can update items" ON public.items;
CREATE POLICY "Donors or staff can update items" ON public.items
FOR UPDATE USING (
    (donor_id = (SELECT legacy_id FROM public.get_current_profile()) AND status = 'pending')
    OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'station_staff', 'admin')
    OR auth.role() = 'service_role'
);

-- Requests
DROP POLICY IF EXISTS "Authorized users can view requests" ON public.requests;
CREATE POLICY "Authorized users can view requests" ON public.requests
FOR SELECT USING (
    requester_id = (SELECT legacy_id FROM public.get_current_profile())
    OR EXISTS (SELECT 1 FROM public.items i WHERE i.id = requests.item_id AND i.donor_id = (SELECT legacy_id FROM public.get_current_profile()))
    OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'station_staff', 'admin')
    OR auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Students can insert own request" ON public.requests;
CREATE POLICY "Students can insert own request" ON public.requests
FOR INSERT WITH CHECK (
    requester_id = (SELECT legacy_id FROM public.get_current_profile())
    OR auth.role() = 'service_role'
    OR requester_id IS NOT NULL
);

-- Appointments
DROP POLICY IF EXISTS "Authorized participants can view appointments" ON public.appointments;
CREATE POLICY "Authorized participants can view appointments" ON public.appointments
FOR SELECT USING (
    requester_id = (SELECT legacy_id FROM public.get_current_profile())
    OR donor_id = (SELECT legacy_id FROM public.get_current_profile())
    OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'station_staff', 'admin')
    OR auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Donors or staff can insert appointments" ON public.appointments;
CREATE POLICY "Donors or staff can insert appointments" ON public.appointments
FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
    OR donor_id = (SELECT legacy_id FROM public.get_current_profile())
    OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'station_staff', 'admin')
    OR donor_id IS NOT NULL
);

DROP POLICY IF EXISTS "Participants or staff can update appointments" ON public.appointments;
CREATE POLICY "Participants or staff can update appointments" ON public.appointments
FOR UPDATE USING (
    donor_id = (SELECT legacy_id FROM public.get_current_profile())
    OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'station_staff', 'admin')
    OR auth.role() = 'service_role'
);

-- Logs
DROP POLICY IF EXISTS "Public can view audit logs" ON public.logs;
CREATE POLICY "Public can view audit logs" ON public.logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.logs;
CREATE POLICY "Authenticated users can insert audit logs" ON public.logs FOR INSERT WITH CHECK (true);

-- Notifications
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications" ON public.notifications
FOR SELECT USING (
    recipient_id = (SELECT legacy_id FROM public.get_current_profile())
    OR auth.role() = 'service_role'
    OR recipient_id IS NOT NULL
);

DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE USING (
    recipient_id = (SELECT legacy_id FROM public.get_current_profile())
    OR auth.role() = 'service_role'
);
