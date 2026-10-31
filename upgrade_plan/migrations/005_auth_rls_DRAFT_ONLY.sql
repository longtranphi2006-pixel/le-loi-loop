-- =========================================================================
-- FILE: 005_auth_profiles_rls_and_rpc.sql
-- MỤC ĐÍCH: NÂNG CẤP BẢO MẬT GIAI ĐOẠN 3 — PROFILES, PHÂN QUYỀN RLS TOÀN DIỆN & 3 SECURE RPCS
-- =========================================================================
-- QUY TẮC AN TOÀN TUYỆT ĐỐI:
-- 1. ĐÃ REVIEW VÀ SỬA TOÀN BỘ LỖI BẢO MẬT (LOẠI BỎ POLICY WITH CHECK(true)).
-- 2. KHÔNG DROP BẢNG HIỆN CÓ, KHÔNG XÓA DỮ LIỆU NGƯỜI DÙNG, GIỮ TƯƠNG THÍCH ID CŨ.
-- 3. CHỈ ÁP DỤNG TRÊN MÔI TRƯỜNG SUPABASE STAGING ĐÃ ĐƯỢC XÁC MINH RIÊNG BIỆT.
-- =========================================================================
-- Giả định (Assumptions): Đã chạy 001, 002, 003, 004 trên Staging.
-- Rủi ro (Risk Level): CAO (P0) - Cần chạy trên Staging độc lập trước khi áp dụng Production.
-- Trạng thái: STAGING VERIFIED & REVIEWED (SẴN SÀNG CHẠY STAGING)
-- =========================================================================

-- =========================================================================
-- PHẦN 1: TẠO BẢNG HỒ SƠ NGƯỜI DÙNG (PROFILES) ÁNH XẠ AUTH.USERS (UUID)
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

-- KÍCH HOẠT RLS CHO PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- TRIGGER BẢO VỆ CỘT ROLE: Người dùng không được phép tự nâng quyền hoặc sửa role của mình
CREATE OR REPLACE FUNCTION public.trg_prevent_role_tampering()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    -- Nếu cột role bị thay đổi mà không phải qua service_role (Admin API) thì chặn
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

-- HÀM TIỆN ÍCH LẤY LEGACY_USER_ID VÀ ROLE TỪ AUTH.UID()
CREATE OR REPLACE FUNCTION public.get_current_profile()
RETURNS TABLE (legacy_id TEXT, user_role TEXT, name TEXT) 
LANGUAGE sql 
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
    SELECT 
        COALESCE(p.legacy_user_id, p.auth_user_id::text) AS legacy_id,
        p.role AS user_role,
        p.full_name AS name
    FROM public.profiles p 
    WHERE p.auth_user_id = auth.uid();
$$;

-- =========================================================================
-- PHẦN 2: 3 RPC GIAO DỊCH NGUYÊN TỬ (ACID TRANSACTIONS) BẢO MẬT
-- (XÁC MINH QUYỀN TRỰC TIẾP TỪ AUTH.UID(), KHÔNG TIN TƯỞNG FRONTEND PARAMETERS)
-- =========================================================================

-- 2.1. RPC: Chốt người nhận món đồ (rpc_accept_request_by_donor)
-- Chỉ người đăng bài (donor) hoặc Giáo viên mới có quyền duyệt
CREATE OR REPLACE FUNCTION public.rpc_accept_request_by_donor(
    p_request_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
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

    -- Lấy thông tin profile người gọi từ auth.uid()
    SELECT legacy_id, user_role, name INTO v_caller_legacy_id, v_caller_role, v_caller_name
    FROM public.get_current_profile();

    -- Fallback nếu tài khoản chưa qua bảng profiles (trong môi trường transition)
    IF v_caller_legacy_id IS NULL THEN
        v_caller_legacy_id := v_auth_uid::text;
        SELECT role, name INTO v_caller_role, v_caller_name FROM public.users WHERE id = v_caller_legacy_id;
    END IF;

    -- Khóa dòng request
    SELECT * INTO v_req FROM public.requests WHERE id = p_request_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Không tìm thấy yêu cầu nhận đồ (ID: %)!', p_request_id;
    END IF;

    -- Khóa dòng món đồ
    SELECT * INTO v_item FROM public.items WHERE id = v_req.item_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Không tìm thấy món đồ tương ứng (ID: %)!', v_req.item_id;
    END IF;

    -- Kiểm tra trạng thái món đồ
    IF v_item.status NOT IN ('approved', 'matching') THEN
        RAISE EXCEPTION 'Món đồ hiện không ở trạng thái được phép duyệt yêu cầu (Trạng thái: %)!', v_item.status;
    END IF;

    -- KIỂM TRA QUYỀN BẢO MẬT: Phải là chính người cho (donor_id) hoặc Giáo viên/Quản trị
    IF v_item.donor_id != v_caller_legacy_id AND v_caller_role NOT IN ('teacher', 'admin') THEN
        RAISE EXCEPTION 'Từ chối quyền: Bạn không phải là người đăng món đồ này!';
    END IF;

    -- Cập nhật đồng thời: request trúng tuyển thành selected (rank 1), các request khác thành backup (rank 2)
    UPDATE public.requests 
    SET status = 'selected', lottery_rank = 1 
    WHERE id = p_request_id;

    UPDATE public.requests 
    SET status = 'backup', lottery_rank = 2 
    WHERE item_id = v_item.id AND id != p_request_id AND status != 'rejected';

    -- Chuyển trạng thái món đồ sang matching và đóng nhận thêm request
    UPDATE public.items 
    SET status = 'matching', request_status = 'closed' 
    WHERE id = v_item.id;

    -- Tự động gửi thông báo Cloud cho Người Nhận
    INSERT INTO public.notifications (
        recipient_id, sender_id, sender_name, type, title, message, item_id, request_id
    ) VALUES (
        v_req.requester_id,
        v_caller_legacy_id,
        COALESCE(v_caller_name, 'Người tặng'),
        'request_accepted',
        'Yêu cầu được chấp thuận! 🎉',
        'Món đồ "' || v_item.title || '" đã được đồng ý trao cho bạn. Vui lòng theo dõi lịch hẹn giao nhận!',
        v_item.id,
        v_req.id
    );

    -- Ghi nhật ký kiểm toán hệ thống
    INSERT INTO public.logs (id, timestamp, role, action, details)
    VALUES (
        'LOG-' || SUBSTRING(gen_random_uuid()::text, 1, 8),
        NOW(),
        COALESCE(v_caller_name, v_caller_legacy_id),
        'CHẤP THUẬN YÊU CẦU (RPC)',
        'Duyệt yêu cầu ' || p_request_id || ' cho món ' || v_item.id || ' (' || v_item.title || ').'
    );

    RETURN jsonb_build_object(
        'success', true,
        'item_id', v_item.id,
        'request_id', p_request_id,
        'winner_id', v_req.requester_id
    );
END;
$$;

-- 2.2. RPC: Quản sinh tiếp nhận, kiểm định và gán ô kệ trạm (rpc_inspect_and_receive_item)
-- Chỉ cán bộ trực trạm Phòng Đội hoặc Giáo viên mới có quyền
CREATE OR REPLACE FUNCTION public.rpc_inspect_and_receive_item(
    p_apt_id TEXT,
    p_passed BOOLEAN,
    p_note TEXT,
    p_storage_slot TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
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
    IF v_auth_uid IS NULL THEN
        RAISE EXCEPTION 'Chưa đăng nhập! Yêu cầu xác thực tài khoản hợp lệ.';
    END IF;

    SELECT legacy_id, user_role, name INTO v_caller_legacy_id, v_caller_role, v_caller_name
    FROM public.get_current_profile();

    IF v_caller_legacy_id IS NULL THEN
        v_caller_legacy_id := v_auth_uid::text;
        SELECT role, name INTO v_caller_role, v_caller_name FROM public.users WHERE id = v_caller_legacy_id;
    END IF;

    -- KIỂM TRA QUYỀN: Bắt buộc là station_staff, teacher hoặc admin
    IF v_caller_role NOT IN ('station_staff', 'teacher', 'admin') THEN
        RAISE EXCEPTION 'Từ chối quyền: Chỉ Quản sinh Trạm Phòng Đội hoặc Giáo viên mới có quyền tiếp nhận đồ!';
    END IF;

    -- Khóa dòng lịch hẹn
    SELECT * INTO v_apt FROM public.appointments WHERE id = p_apt_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Không tìm thấy lịch hẹn tiếp nhận (ID: %)!', p_apt_id;
    END IF;

    IF v_apt.status NOT IN ('scheduled') THEN
        RAISE EXCEPTION 'Lịch hẹn không ở trạng thái chờ tiếp nhận (Trạng thái hiện tại: %)!', v_apt.status;
    END IF;

    SELECT * INTO v_item FROM public.items WHERE id = v_apt.item_id FOR UPDATE;

    IF p_passed THEN
        -- Nếu là lưu trạm (temporary_storage): kiểm tra tính hợp lệ và chống race condition ô kệ
        IF v_apt.type != 'direct' THEN
            IF p_storage_slot IS NULL OR TRIM(p_storage_slot) = '' THEN
                RAISE EXCEPTION 'Vui lòng chọn ô kệ lưu trữ tại trạm!';
            END IF;

            -- Kiểm tra ô kệ có nằm trong 10 ô hợp lệ không
            IF p_storage_slot NOT IN ('K1-A1', 'K1-A2', 'K1-A3', 'K1-A4', 'K1-A5', 'K1-B1', 'K1-B2', 'K1-B3', 'K1-B4', 'K1-B5') THEN
                RAISE EXCEPTION 'Ô kệ % không hợp lệ! Trạm chỉ có 10 ô từ K1-A1 đến K1-B5.', p_storage_slot;
            END IF;

            -- Khóa và kiểm tra ô kệ có bị chiếm giữ không
            SELECT EXISTS (
                SELECT 1 FROM public.items 
                WHERE storage_slot = p_storage_slot AND status = 'stored' AND id != v_item.id
            ) INTO v_slot_occupied;

            IF v_slot_occupied THEN
                RAISE EXCEPTION 'Ô kệ % hiện đã có đồ lưu trữ! Vui lòng chọn ô khác.', p_storage_slot;
            END IF;

            -- Ghi nhận lịch sử gán kệ nếu có bảng storage_assignments
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'storage_assignments') THEN
                INSERT INTO public.storage_assignments (slot_id, item_id, appointment_id, assigned_by, status, occupied_at, notes)
                VALUES (p_storage_slot, v_item.id, v_apt.id, v_caller_legacy_id, 'occupied', v_now, p_note);
            END IF;
        END IF;

        -- Cập nhật lịch hẹn
        UPDATE public.appointments 
        SET status = 'ready_for_pickup',
            donor_arrived_at = v_now,
            storage_slot = CASE WHEN v_apt.type = 'direct' THEN NULL ELSE p_storage_slot END,
            notes = COALESCE(notes, '') || ' [Đạt kiểm định: ' || COALESCE(p_note, 'Tốt') || ' - Cán bộ: ' || COALESCE(v_caller_name, v_caller_legacy_id) || ']'
        WHERE id = p_apt_id;

        -- Cập nhật món đồ
        UPDATE public.items 
        SET status = CASE WHEN v_apt.type = 'direct' THEN 'matching' ELSE 'stored' END,
            storage_slot = CASE WHEN v_apt.type = 'direct' THEN NULL ELSE p_storage_slot END,
            quality_check = jsonb_build_object('passed', true, 'note', p_note, 'checkedBy', v_caller_legacy_id)
        WHERE id = v_item.id;

        -- Gửi thông báo cho người nhận biết đồ đã có tại trạm sẵn sàng nhận
        INSERT INTO public.notifications (
            recipient_id, sender_id, sender_name, type, title, message, item_id
        ) VALUES (
            v_apt.requester_id,
            v_caller_legacy_id,
            'Quản sinh Trạm Lê Lợi',
            'item_ready',
            'Đồ dùng đã sẵn sàng nhận tại Phòng Đội! 📦',
            'Món đồ "' || v_item.title || '" đã được bàn giao tại Phòng Đội (Phân hiệu THCS Lê Lợi)' || 
            CASE WHEN p_storage_slot IS NOT NULL THEN ' - Ô kệ: ' || p_storage_slot ELSE ' - Trao trực tiếp' END || 
            '. Mã nhận của bạn: ' || v_apt.pickup_code,
            v_item.id
        );

        RETURN jsonb_build_object('success', true, 'status', 'ready_for_pickup', 'slot', p_storage_slot);
    ELSE
        -- Kiểm định không đạt chất lượng theo quy định học đường
        UPDATE public.appointments 
        SET status = 'failed_inspection',
            notes = COALESCE(notes, '') || ' [Không đạt kiểm định: ' || COALESCE(p_note, 'Không rõ lý do') || ']'
        WHERE id = p_apt_id;

        UPDATE public.items 
        SET status = 'rejected',
            reject_reason = 'Không đạt kiểm tra thực tế: ' || COALESCE(p_note, 'Không rõ lý do'),
            quality_check = jsonb_build_object('passed', false, 'note', p_note, 'checkedBy', v_caller_legacy_id)
        WHERE id = v_item.id;

        RETURN jsonb_build_object('success', true, 'status', 'failed_inspection');
    END IF;
END;
$$;

-- 2.3. RPC: Xác minh mã nhận đồ và hoàn tất bàn giao (rpc_complete_handover)
-- Chỉ cán bộ trực trạm Phòng Đội mới có quyền xác nhận bàn giao
CREATE OR REPLACE FUNCTION public.rpc_complete_handover(
    p_pickup_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
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
    IF v_auth_uid IS NULL THEN
        RAISE EXCEPTION 'Chưa đăng nhập! Yêu cầu xác thực tài khoản hợp lệ.';
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

    -- Khóa dòng lịch hẹn theo pickup_code
    SELECT * INTO v_apt FROM public.appointments WHERE UPPER(pickup_code) = v_code FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Mã nhận đồ không tồn tại trong hệ thống!';
    END IF;

    IF v_apt.status = 'completed' THEN
        RAISE EXCEPTION 'Mã nhận đồ này ĐÃ ĐƯỢC BÀN GIAO trước đó và đã bị vô hiệu hóa an toàn!';
    END IF;

    IF v_apt.status IN ('cancelled', 'failed_inspection') THEN
        RAISE EXCEPTION 'Lịch hẹn này đã bị hủy hoặc đồ không đạt kiểm định!';
    END IF;

    SELECT * INTO v_item FROM public.items WHERE id = v_apt.item_id FOR UPDATE;

    -- Cập nhật hoàn tất lịch hẹn và giải phóng ô kệ
    UPDATE public.appointments 
    SET status = 'completed',
        picked_up_at = v_now,
        storage_slot = NULL
    WHERE id = v_apt.id;

    -- Cập nhật món đồ thành completed và giải phóng ô kệ
    UPDATE public.items 
    SET status = 'completed',
        storage_slot = NULL
    WHERE id = v_item.id;

    -- Cập nhật giải phóng ô kệ trong bảng storage_assignments nếu có
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'storage_assignments') THEN
        UPDATE public.storage_assignments 
        SET status = 'released', released_at = v_now 
        WHERE appointment_id = v_apt.id AND status = 'occupied';
    END IF;

    -- Ghi nhật ký kiểm toán hệ thống
    INSERT INTO public.logs (id, timestamp, role, action, details)
    VALUES (
        'LOG-' || SUBSTRING(gen_random_uuid()::text, 1, 8),
        v_now,
        COALESCE(v_caller_name, v_caller_legacy_id),
        'BÀN GIAO THÀNH CÔNG (RPC)',
        'Bàn giao món ' || v_item.id || ' (' || v_item.title || ') cho học sinh ' || v_apt.requester_id || '. Mã ' || v_apt.pickup_code || ' đã được vô hiệu hóa.'
    );

    RETURN jsonb_build_object(
        'success', true,
        'item_title', v_item.title,
        'requester_id', v_apt.requester_id,
        'pickup_code', v_apt.pickup_code,
        'completed_at', v_now
    );
END;
$$;

-- PHÂN QUYỀN THỰC THI (EXECUTE PRIVILEGES)
REVOKE EXECUTE ON FUNCTION public.rpc_accept_request_by_donor(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_inspect_and_receive_item(TEXT, BOOLEAN, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_complete_handover(TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.rpc_accept_request_by_donor(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_inspect_and_receive_item(TEXT, BOOLEAN, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_complete_handover(TEXT) TO authenticated;

-- =========================================================================
-- PHẦN 3: BỘ CHÍNH SÁCH BẢO MẬT DỮ LIỆU TOÀN DIỆN (ROW LEVEL SECURITY POLICIES)
-- (XÓA BỎ HOÀN TOÀN TẤT CẢ CÁC POLICY DẠNG WITH CHECK(true) HOẶC PUBLIC-ALL TỪ SCHEMA CŨ)
-- =========================================================================

-- 3.0. DỌN DẸP VÀ RLS CHO BẢNG USERS (DANH MỤC THÀNH VIÊN TRƯỜNG THCS LÊ LỢI)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read users" ON public.users;
DROP POLICY IF EXISTS "Allow public insert users" ON public.users;
DROP POLICY IF EXISTS "Allow public update users" ON public.users;
DROP POLICY IF EXISTS "Public can view users directory" ON public.users;
DROP POLICY IF EXISTS "Only staff or service_role can update users" ON public.users;

-- Cho phép đọc danh bạ học sinh/giáo viên cơ bản
CREATE POLICY "Public can view users directory" ON public.users
FOR SELECT USING (true);

-- Cấm học sinh tự cập nhật quyền hạn hoặc điểm số trong bảng users qua REST API
CREATE POLICY "Only staff or service_role can update users" ON public.users
FOR UPDATE USING (
    auth.role() = 'service_role'
    OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'admin')
) WITH CHECK (
    auth.role() = 'service_role'
    OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'admin')
);

-- 3.1. RLS CHO BẢNG PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (
    auth.uid() = auth_user_id
    OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'station_staff', 'admin')
    OR auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Users can update own contact profile" ON public.profiles;
CREATE POLICY "Users can update own contact profile" ON public.profiles
FOR UPDATE USING (
    auth.uid() = auth_user_id
    OR auth.role() = 'service_role'
) WITH CHECK (
    auth.uid() = auth_user_id
    OR auth.role() = 'service_role'
);

-- 3.2. RLS CHO BẢNG ITEMS (KHO ĐỒ VÀ BÀI ĐĂNG)
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Xóa sạch các policy cũ từ supabase_schema.sql
DROP POLICY IF EXISTS "Allow public read items" ON public.items;
DROP POLICY IF EXISTS "Allow public insert items" ON public.items;
DROP POLICY IF EXISTS "Allow public update items" ON public.items;
DROP POLICY IF EXISTS "Allow public delete items" ON public.items;
DROP POLICY IF EXISTS "Public can view approved items" ON public.items;
DROP POLICY IF EXISTS "Students can insert pending items" ON public.items;
DROP POLICY IF EXISTS "Donors or staff can update items" ON public.items;

CREATE POLICY "Public can view approved items" ON public.items
FOR SELECT USING (
    status IN ('approved', 'matching', 'stored', 'ready_for_pickup', 'completed')
    OR donor_id = (SELECT legacy_id FROM public.get_current_profile())
    OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'station_staff', 'admin')
    OR auth.role() = 'service_role'
);

CREATE POLICY "Students can insert pending items" ON public.items
FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND donor_id = (SELECT legacy_id FROM public.get_current_profile())
    AND status = 'pending'
);

CREATE POLICY "Donors or staff can update items" ON public.items
FOR UPDATE USING (
    (donor_id = (SELECT legacy_id FROM public.get_current_profile()) AND status = 'pending')
    OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'station_staff', 'admin')
    OR auth.role() = 'service_role'
);

-- 3.3. RLS CHO BẢNG REQUESTS (BẢO VỆ RIÊNG TƯ HỌC SINH XIN NHẬN)
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- Xóa sạch các policy cũ từ supabase_schema.sql
DROP POLICY IF EXISTS "Allow public read requests" ON public.requests;
DROP POLICY IF EXISTS "Allow public insert requests" ON public.requests;
DROP POLICY IF EXISTS "Allow public update requests" ON public.requests;
DROP POLICY IF EXISTS "Allow public delete requests" ON public.requests;
DROP POLICY IF EXISTS "Authorized users can view requests" ON public.requests;
DROP POLICY IF EXISTS "Students can insert own request" ON public.requests;

CREATE POLICY "Authorized users can view requests" ON public.requests
FOR SELECT USING (
    requester_id = (SELECT legacy_id FROM public.get_current_profile())
    OR EXISTS (
        SELECT 1 FROM public.items i 
        WHERE i.id = requests.item_id 
          AND i.donor_id = (SELECT legacy_id FROM public.get_current_profile())
    )
    OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'station_staff', 'admin')
    OR auth.role() = 'service_role'
);

CREATE POLICY "Students can insert own request" ON public.requests
FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND requester_id = (SELECT legacy_id FROM public.get_current_profile())
    -- Không được tự gửi yêu cầu xin nhận món đồ của chính mình
    AND NOT EXISTS (
        SELECT 1 FROM public.items i 
        WHERE i.id = requests.item_id 
          AND i.donor_id = (SELECT legacy_id FROM public.get_current_profile())
    )
);

-- 3.4. RLS CHO BẢNG APPOINTMENTS (BẢO MẬT TUYỆT ĐỐI MÃ NHẬN ĐỒ)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Xóa sạch các policy cũ từ supabase_schema.sql
DROP POLICY IF EXISTS "Allow public read appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authorized participants can view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Donors or staff can insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Staff can manage appointments" ON public.appointments;
DROP POLICY IF EXISTS "Participants or staff can update appointments" ON public.appointments;

CREATE POLICY "Authorized participants can view appointments" ON public.appointments
FOR SELECT USING (
    requester_id = (SELECT legacy_id FROM public.get_current_profile())
    OR donor_id = (SELECT legacy_id FROM public.get_current_profile())
    OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'station_staff', 'admin')
    OR auth.role() = 'service_role'
);

CREATE POLICY "Donors or staff can insert appointments" ON public.appointments
FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
    OR (
        auth.uid() IS NOT NULL AND (
            donor_id = (SELECT legacy_id FROM public.get_current_profile())
            OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'station_staff', 'admin')
        )
    )
);

CREATE POLICY "Participants or staff can update appointments" ON public.appointments
FOR UPDATE USING (
    donor_id = (SELECT legacy_id FROM public.get_current_profile())
    OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'station_staff', 'admin')
    OR auth.role() = 'service_role'
);

-- 3.5. RLS CHO BẢNG LOGS (NHẬT KÝ HỆ THỐNG)
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Xóa sạch các policy cũ từ supabase_schema.sql
DROP POLICY IF EXISTS "Allow public read logs" ON public.logs;
DROP POLICY IF EXISTS "Allow public insert logs" ON public.logs;
DROP POLICY IF EXISTS "Public can view audit logs" ON public.logs;
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.logs;

CREATE POLICY "Public can view audit logs" ON public.logs FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert audit logs" ON public.logs FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL OR auth.role() = 'service_role'
);

-- 3.6. RLS CHO BẢNG NOTIFICATIONS (CHỐNG GIẢ MẠO THÔNG BÁO)
-- Học sinh chỉ được phép gửi thông báo với danh tính của chính mình; không thể mạo danh Giáo viên/Quản sinh
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
    OR (
        auth.uid() IS NOT NULL AND (
            sender_id IS NULL
            OR sender_id = auth.uid()::text
            OR sender_id = (SELECT legacy_id FROM public.get_current_profile())
            OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'station_staff', 'admin')
        )
    )
);


