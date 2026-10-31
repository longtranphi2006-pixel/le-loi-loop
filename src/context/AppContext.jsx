import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  USERS,
  STATION_SLOTS,
  STORAGE_SLOTS,
  CATEGORIES,
  INITIAL_ITEMS,
  INITIAL_REQUESTS,
  INITIAL_APPOINTMENTS,
  INITIAL_LOGS,
  INITIAL_NOTIFICATIONS
} from '../data/seedData';
import { generatePickupCode, runLotteryWithSeed } from '../utils/loopMatchAlgorithm';
import {
  supabase,
  isSupabaseConfigured,
  genUniqueId,
  mapItemFromDb,
  mapItemToDb,
  mapRequestFromDb,
  mapRequestToDb,
  mapAppointmentFromDb,
  mapAppointmentToDb,
  mapLogFromDb,
  mapLogToDb,
  mapNotificationFromDb,
  mapNotificationToDb
} from '../lib/supabase';

const STORAGE_KEY_PREFIX = 'LE_LOI_LOOP_V1_';
const KEYS = {
  USER: STORAGE_KEY_PREFIX + 'USER',
  ITEMS: STORAGE_KEY_PREFIX + 'ITEMS',
  REQUESTS: STORAGE_KEY_PREFIX + 'REQUESTS',
  APPOINTMENTS: STORAGE_KEY_PREFIX + 'APPOINTMENTS',
  LOGS: STORAGE_KEY_PREFIX + 'LOGS',
  NOTIFICATIONS: STORAGE_KEY_PREFIX + 'NOTIFICATIONS',
};

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(KEYS.USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return USERS[0]; // HS001 Trần Bảo An mặc định
  });

  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(KEYS.ITEMS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_ITEMS;
  });

  const [requests, setRequests] = useState(() => {
    try {
      const saved = localStorage.getItem(KEYS.REQUESTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_REQUESTS;
  });

  const [appointments, setAppointments] = useState(() => {
    try {
      const saved = localStorage.getItem(KEYS.APPOINTMENTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_APPOINTMENTS;
  });

  const [logs, setLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(KEYS.LOGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_LOGS;
  });

  // 6. Notifications (Thông báo thời gian thực giữa người cho và người nhận)
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(KEYS.NOTIFICATIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [notification, setNotification] = useState(null);
  const [dbConnected, setDbConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('syncing'); // 'synced' | 'syncing' | 'sync_error' | 'offline'
  const [syncError, setSyncError] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [inFlightOps, setInFlightOps] = useState(new Set());

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  // Hàm ánh xạ hồ sơ người dùng từ Auth session qua bảng profiles / metadata
  const resolveUserProfile = useCallback(async (user) => {
    if (!user) return null;
    if (isSupabaseConfigured && supabase) {
      // 1. Tra cứu bảng profiles theo auth_user_id (UUID)
      try {
        const { data: prof, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (!error && prof) {
          return {
            id: prof.legacy_user_id || prof.auth_user_id,
            name: prof.full_name,
            role: prof.role,
            class: prof.class || '',
            shift: prof.shift || 'Sáng',
            avatar: prof.avatar || USERS[0].avatar,
            phone: prof.phone || '',
            points: prof.points || 0
          };
        }
      } catch (e) {
        console.warn('Tra cứu bảng profiles:', e.message);
      }

      // 2. Tra cứu bảng users theo metadata legacy_id
      try {
        const legacyId = user.user_metadata?.student_id || user.user_metadata?.legacy_id;
        if (legacyId) {
          const { data: u, error } = await supabase.from('users').select('*').eq('id', legacyId).maybeSingle();
          if (!error && u) return u;
        }
      } catch (e) {
        console.warn('Tra cứu bảng users:', e.message);
      }
    }

    // 3. Fallback an toàn theo user_metadata hoặc danh mục USERS
    const matchedUser = USERS.find(u => u.id === user.user_metadata?.student_id) || {
      id: user.id.slice(0, 8).toUpperCase(),
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Người dùng',
      role: user.user_metadata?.role || 'student',
      class: user.user_metadata?.class || '',
      shift: user.user_metadata?.shift || 'Sáng',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      phone: '',
      points: 0
    };
    return matchedUser;
  }, []);

  // Lắng nghe trạng thái đăng nhập Supabase Auth
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    // 1. Kiểm tra session hiện tại
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setAuthUser(session.user);
        const resolved = await resolveUserProfile(session.user);
        if (resolved) {
          setCurrentUser(resolved);
        }
      }
    });

    // 2. Lắng nghe thay đổi auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setAuthUser(session.user);
        const resolved = await resolveUserProfile(session.user);
        if (resolved) {
          setCurrentUser(resolved);
        }
      } else {
        setAuthUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [resolveUserProfile]);

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setAuthUser(null);
    showNotification('Đã đăng xuất khỏi tài khoản!', 'info');
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => {
      setNotification(prev => (prev?.id ? null : prev));
    }, 4500);
  };

  // Sync to localStorage as local cache/fallback
  useEffect(() => {
    try {
      localStorage.setItem(KEYS.USER, JSON.stringify(currentUser));
      localStorage.setItem(KEYS.ITEMS, JSON.stringify(items));
      localStorage.setItem(KEYS.REQUESTS, JSON.stringify(requests));
      localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(appointments));
      localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {
      console.error(e);
    }
  }, [currentUser, items, requests, appointments, logs, notifications]);

  // Hàm tải dữ liệu từ Supabase - Supabase là Single Source of Truth
  const loadDataFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setSyncStatus('offline');
      return;
    }

    try {
      setIsSyncing(true);
      const [itemsRes, requestsRes, appointmentsRes, logsRes, notifsRes] = await Promise.all([
        supabase.from('items').select('*').order('created_at', { ascending: false }),
        supabase.from('requests').select('*').order('created_at', { ascending: false }),
        supabase.from('appointments').select('*').order('created_at', { ascending: false }),
        supabase.from('logs').select('*').order('timestamp', { ascending: false }),
        supabase.from('notifications').select('*').order('created_at', { ascending: false })
      ]);

      // Kiểm tra lỗi truy vấn cơ bản
      if (itemsRes.error) throw new Error(`Lỗi tải Items: ${itemsRes.error.message}`);
      if (requestsRes.error) throw new Error(`Lỗi tải Requests: ${requestsRes.error.message}`);
      if (appointmentsRes.error) throw new Error(`Lỗi tải Appointments: ${appointmentsRes.error.message}`);
      if (logsRes.error) throw new Error(`Lỗi tải Logs: ${logsRes.error.message}`);

      // Nếu Cloud trả về danh sách (dù rỗng []), cập nhật chính xác theo Cloud
      if (Array.isArray(itemsRes.data)) {
        setItems(itemsRes.data.map(mapItemFromDb));
      }

      if (Array.isArray(requestsRes.data)) {
        setRequests(requestsRes.data.map(mapRequestFromDb));
      }

      if (Array.isArray(appointmentsRes.data)) {
        setAppointments(appointmentsRes.data.map(mapAppointmentFromDb));
      }

      if (Array.isArray(logsRes.data)) {
        setLogs(logsRes.data.map(mapLogFromDb));
      }

      // Xử lý bảng notifications (có thể chưa chạy migration)
      if (!notifsRes.error && Array.isArray(notifsRes.data)) {
        setNotifications(notifsRes.data.map(mapNotificationFromDb));
      }

      setDbConnected(true);
      setSyncStatus('synced');
      setSyncError(null);
      console.log('✓ Supabase: Đồng bộ dữ liệu Cloud thành công!');
    } catch (err) {
      console.warn('Supabase fetch error, fallback to local cache:', err);
      setDbConnected(false);
      setSyncStatus('sync_error');
      setSyncError(err.message || 'Lỗi kết nối Supabase Cloud');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Thiết lập Supabase Realtime Listener (Hỗ trợ 5 bảng bao gồm notifications)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    loadDataFromSupabase();

    const channel = supabase
      .channel('le-loi-loop-realtime-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
        loadDataFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => {
        loadDataFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        loadDataFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'logs' }, () => {
        loadDataFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        loadDataFromSupabase();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setDbConnected(true);
          setSyncStatus('synced');
        } else if (status === 'CHANNEL_ERROR') {
          setSyncStatus('sync_error');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadDataFromSupabase]);

  // Nạp toàn bộ Seed Data lên Supabase Database
  const uploadSeedToSupabase = async () => {
    if (!isSupabaseConfigured || !supabase) {
      showNotification('Vui lòng cấu hình VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY trước!', 'warning');
      return;
    }

    try {
      setIsSyncing(true);
      showNotification('Đang đồng bộ dữ liệu mẫu lên Supabase...', 'info');

      // 1. Users
      await supabase.from('users').upsert(USERS.map(u => ({
        id: u.id,
        name: u.name,
        role: u.role,
        class: u.class,
        shift: u.shift,
        avatar: u.avatar,
        phone: u.phone,
        points: u.points,
        bio: u.bio
      })));

      // 2. Items
      await supabase.from('items').upsert(INITIAL_ITEMS.map(mapItemToDb));

      // 3. Requests
      await supabase.from('requests').upsert(INITIAL_REQUESTS.map(mapRequestToDb));

      // 4. Appointments
      await supabase.from('appointments').upsert(INITIAL_APPOINTMENTS.map(mapAppointmentToDb));

      // 5. Logs
      await supabase.from('logs').upsert(INITIAL_LOGS.map(mapLogToDb));

      await loadDataFromSupabase();
      showNotification('Đã nạp toàn bộ Seed Data lên Supabase thành công!', 'success');
    } catch (err) {
      console.error(err);
      showNotification('Lỗi khi nạp dữ liệu lên Supabase: ' + err.message, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Thêm Log hệ thống
  const addLog = async (action, details, role = `${currentUser.id} (${currentUser.name})`) => {
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
    const newLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp,
      role,
      action,
      details
    };
    setLogs(prev => [newLog, ...prev]);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('logs').insert([mapLogToDb(newLog)]);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Khôi phục dữ liệu ban đầu
  const resetToSeedData = async () => {
    localStorage.removeItem(KEYS.USER);
    localStorage.removeItem(KEYS.ITEMS);
    localStorage.removeItem(KEYS.REQUESTS);
    localStorage.removeItem(KEYS.APPOINTMENTS);
    localStorage.removeItem(KEYS.LOGS);

    setCurrentUser(USERS[0]);
    setItems(INITIAL_ITEMS);
    setRequests(INITIAL_REQUESTS);
    setAppointments(INITIAL_APPOINTMENTS);
    setLogs(INITIAL_LOGS);

    if (isSupabaseConfigured && supabase) {
      uploadSeedToSupabase();
    } else {
      showNotification('Đã khôi phục dữ liệu demo ban đầu thành công!', 'info');
    }
  };

  // Tạo thông báo mới (Đồng bộ Cloud và Local)
  const createNotification = async ({
    recipientId,
    senderId,
    senderName,
    type,
    title,
    message,
    itemId,
    requestId
  }) => {
    const newNotif = {
      id: genUniqueId('NOTIF'),
      recipientId,
      senderId,
      senderName,
      type, // 'new_request' | 'request_accepted' | 'item_approved' | 'item_ready'
      title,
      message,
      itemId,
      requestId,
      isRead: false,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setNotifications(prev => [newNotif, ...prev]);

    // Nếu người nhận đang đăng nhập trên thiết bị này, hiển thị thông báo popup ngay lập tức!
    if (recipientId === currentUser.id) {
      showNotification(`🔔 ${title}: ${message}`, 'info');
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('notifications').insert([mapNotificationToDb(newNotif)]);
        if (error) {
          console.warn('Supabase notifications insert error (bảng notifications có thể chưa được tạo qua migration):', error.message);
        }
      } catch (e) {
        console.warn('Notifications insert exception:', e);
      }
    }
    return newNotif;
  };

  const markNotificationAsRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      } catch (e) {
        console.warn('Supabase markNotificationAsRead error:', e);
      }
    }
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications(prev => prev.map(n => n.recipientId === currentUser.id ? { ...n, isRead: true } : n));
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', currentUser.id);
      } catch (e) {
        console.warn('Supabase markAllNotificationsAsRead error:', e);
      }
    }
  };

  const switchRole = (userId) => {
    // Nếu đang kết nối Cloud Supabase và đã đăng nhập bằng Auth:
    // Chặn học sinh tự ý chuyển sang tài khoản giáo viên/quản sinh qua RoleSwitcher!
    if (isSupabaseConfigured && authUser) {
      showNotification('Hệ thống đang hoạt động với phiên Supabase Auth. Để đổi vai trò, vui lòng Đăng xuất và Đăng nhập bằng tài khoản tương ứng.', 'warning');
      openAuthModal();
      return;
    }

    // Nếu chưa đăng nhập Auth trên Cloud: chặn truy cập trái phép vai trò nhạy cảm
    if (isSupabaseConfigured) {
      const target = USERS.find(u => u.id === userId);
      if (target && (target.role === 'teacher' || target.role === 'station_staff' || target.role === 'admin')) {
        showNotification('Vai trò Giáo viên/Quản sinh yêu cầu đăng nhập qua Supabase Auth để bảo mật!', 'warning');
        openAuthModal();
        return;
      }
    }

    const target = USERS.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
      const userUnread = notifications.filter(n => n.recipientId === target.id && !n.isRead);
      if (userUnread.length > 0) {
        showNotification(`🔔 ${target.name} có ${userUnread.length} thông báo mới! (Yêu cầu gần nhất: ${userUnread[0].message})`, 'info');
      } else {
        showNotification(`Đã chuyển vai trò: ${target.name} [${target.id}] (Chế độ mô phỏng)`, 'info');
      }
      addLog('CHUYỂN ĐỔI VAI TRÒ', `Người dùng chuyển sang đóng vai ${target.name} (${target.id})`);
    }
  };

  // Đăng món đồ mới (HS) - Cloud-First: Chỉ cập nhật state sau khi Database xác nhận
  const addItem = async (itemData) => {
    const newId = genUniqueId('M');
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newItem = {
      id: newId,
      ...itemData,
      donorId: currentUser.id,
      donorName: `${currentUser.name} (${currentUser.class})`,
      status: 'pending',
      requestStatus: 'closed',
      createdAt: now,
      qualityCheck: null,
      storageSlot: null
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('items').insert([mapItemToDb(newItem)]);
        if (error) {
          setSyncStatus('sync_error');
          showNotification(`Lưu Cloud thất bại: ${error.message}. Món đồ KHÔNG được đăng.`, 'error');
          return null;
        }
        setItems(prev => [newItem, ...prev]);
        addLog('ĐĂNG MÓN MỚI', `Học sinh ${currentUser.name} (${currentUser.id}) gửi đăng món "${newItem.title}" qua hình thức ${newItem.inputMethod === 'website' ? 'Website' : 'Phiếu giấy'}.`);
        showNotification('Đăng món thành công! Món đồ đang ở trạng thái Chờ duyệt thông tin.', 'success');
        return newId;
      } catch (err) {
        console.error('Supabase addItem error:', err);
        setSyncStatus('sync_error');
        showNotification(`Lỗi kết nối Cloud: ${err.message}. Món đồ không được lưu.`, 'error');
        return null;
      }
    } else {
      setItems(prev => [newItem, ...prev]);
      addLog('ĐĂNG MÓN MỚI (LOCAL)', `Học sinh ${currentUser.name} (${currentUser.id}) đăng món "${newItem.title}".`);
      showNotification('Đăng món thành công (Chế độ cục bộ)!', 'info');
      return newId;
    }
  };

  // Phê duyệt món đồ (GV / Đội trực) - Cloud-First
  const approveItem = async (itemId) => {
    if (currentUser.role !== 'teacher' && currentUser.role !== 'station_staff' && currentUser.role !== 'admin') {
      showNotification('Từ chối quyền: Chỉ Giáo viên hoặc Quản sinh mới có quyền phê duyệt bài đăng!', 'error');
      return;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('items').update({ status: 'approved', request_status: 'open' }).eq('id', itemId);
        if (error) {
          setSyncStatus('sync_error');
          showNotification(`Lỗi phê duyệt trên Cloud: ${error.message}`, 'error');
          return;
        }
      } catch (err) {
        console.error('Supabase approveItem error:', err);
        setSyncStatus('sync_error');
        showNotification(`Lỗi kết nối khi duyệt món: ${err.message}`, 'error');
        return;
      }
    }

    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, status: 'approved', requestStatus: 'open' };
      }
      return item;
    }));
    const itm = items.find(i => i.id === itemId);
    addLog('DUYỆT BÀI ĐĂNG', `Đã duyệt bài đăng món ${itemId} (${itm?.title || ''}). Món đồ hiện đã công khai trên Kho đồ.`);
    showNotification(`Đã phê duyệt món ${itemId} hiển thị trên Kho đồ!`, 'success');
  };

  // Từ chối bài đăng - Cloud-First
  const rejectItem = async (itemId, reason) => {
    if (currentUser.role !== 'teacher' && currentUser.role !== 'station_staff' && currentUser.role !== 'admin') {
      showNotification('Từ chối quyền: Chỉ Giáo viên hoặc Quản sinh mới có quyền từ chối bài đăng!', 'error');
      return;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('items').update({ status: 'rejected', request_status: 'closed', reject_reason: reason }).eq('id', itemId);
        if (error) {
          setSyncStatus('sync_error');
          showNotification(`Lỗi từ chối bài đăng trên Cloud: ${error.message}`, 'error');
          return;
        }
      } catch (err) {
        console.error(err);
        setSyncStatus('sync_error');
        showNotification(`Lỗi kết nối khi từ chối món: ${err.message}`, 'error');
        return;
      }
    }

    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, status: 'rejected', requestStatus: 'closed', rejectReason: reason };
      }
      return item;
    }));
    addLog('TỪ CHỐI BÀI ĐĂNG', `Từ chối món ${itemId}. Lý do: ${reason}`);
    showNotification(`Đã từ chối bài đăng ${itemId}.`, 'info');
  };

  // Yêu cầu bổ sung thông tin - Cloud-First
  const requestItemUpdate = async (itemId, note) => {
    if (currentUser.role !== 'teacher' && currentUser.role !== 'station_staff' && currentUser.role !== 'admin') {
      showNotification('Từ chối quyền: Chỉ Giáo viên hoặc Quản sinh mới có quyền yêu cầu bổ sung!', 'error');
      return;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('items').update({ status: 'needs_update', update_note: note }).eq('id', itemId);
        if (error) {
          setSyncStatus('sync_error');
          showNotification(`Lỗi yêu cầu bổ sung trên Cloud: ${error.message}`, 'error');
          return;
        }
      } catch (err) {
        console.error(err);
        setSyncStatus('sync_error');
        showNotification(`Lỗi kết nối khi yêu cầu bổ sung: ${err.message}`, 'error');
        return;
      }
    }

    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, status: 'needs_update', updateNote: note };
      }
      return item;
    }));
    addLog('YÊU CẦU BỔ SUNG', `Yêu cầu bổ sung ảnh/thông tin món ${itemId}: ${note}`);
    showNotification(`Đã gửi yêu cầu bổ sung cho món ${itemId}.`, 'warning');
  };

  // Gửi yêu cầu nhận đồ (HS) - Cloud-First: Chống duplicate & Kiểm tra DB trước
  const addRequest = async (itemId, reason, availableSlots, inputMethod = 'website') => {
    const itm = items.find(i => i.id === itemId);
    if (itm && itm.donorId === currentUser.id) {
      showNotification('Bạn không thể gửi yêu cầu nhận món đồ do chính mình đăng!', 'warning');
      return null;
    }

    // 1. Chống duplicate request ngay tại client
    const existing = requests.find(r => r.itemId === itemId && r.requesterId === currentUser.id && r.status !== 'rejected');
    if (existing) {
      showNotification('Bạn đã gửi yêu cầu nhận món đồ này trước đó rồi!', 'warning');
      return null;
    }

    const newId = genUniqueId('REQ');
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newReq = {
      id: newId,
      itemId,
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      requesterClass: currentUser.class,
      reason,
      availableSlots,
      inputMethod,
      status: 'pending',
      lotteryRank: null,
      createdAt: now
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('requests').insert([mapRequestToDb(newReq)]);
        if (error) {
          setSyncStatus('sync_error');
          if (error.code === '23505') {
            showNotification('Yêu cầu đã tồn tại trong hệ thống (Chống trùng lặp Database)!', 'warning');
          } else {
            showNotification(`Lỗi lưu Cloud: ${error.message}. Yêu cầu không được gửi.`, 'error');
          }
          return null;
        }
      } catch (err) {
        setSyncStatus('sync_error');
        showNotification(`Lỗi kết nối Cloud: ${err.message}`, 'error');
        return null;
      }
    }

    setRequests(prev => [newReq, ...prev]);
    addLog('GỬI YÊU CẦU NHẬN', `Học sinh ${currentUser.name} (${currentUser.id}) gửi yêu cầu nhận món ${itemId} (${itm?.title || ''}).`);
    showNotification('Đã gửi yêu cầu nhận đồ thành công lên Cloud. Vui lòng theo dõi kết quả!', 'success');

    // TỰ ĐỘNG GỬI THÔNG BÁO ĐẾN NGƯỜI CHO
    if (itm && itm.donorId && itm.donorId !== currentUser.id) {
      createNotification({
        recipientId: itm.donorId,
        senderId: currentUser.id,
        senderName: `${currentUser.name} (${currentUser.class})`,
        type: 'new_request',
        title: 'Có bạn xin nhận đồ của bạn!',
        message: `Học sinh ${currentUser.name} (${currentUser.class}) vừa gửi yêu cầu xin nhận món "${itm.title}" của bạn.`,
        itemId: itm.id,
        requestId: newId
      });
    }

    return newId;
  };

  // Đóng đợt đăng ký của 1 món - Cloud-First
  const closeItemRegistration = async (itemId) => {
    if (currentUser.role !== 'teacher' && currentUser.role !== 'station_staff' && currentUser.role !== 'admin') {
      const itm = items.find(i => i.id === itemId);
      if (!itm || itm.donorId !== currentUser.id) {
        showNotification('Từ chối quyền: Bạn không có quyền đóng đợt nhận yêu cầu cho món này!', 'error');
        return;
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('items').update({ request_status: 'closed' }).eq('id', itemId);
        if (error) {
          setSyncStatus('sync_error');
          showNotification(`Lỗi đóng đợt đăng ký trên Cloud: ${error.message}`, 'error');
          return;
        }
      } catch (err) {
        setSyncStatus('sync_error');
        showNotification(`Lỗi kết nối Cloud: ${err.message}`, 'error');
        return;
      }
    }

    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, requestStatus: 'closed' };
      }
      return item;
    }));
    addLog('ĐÓNG ĐỢT ĐĂNG KÝ', `Đóng nhận thêm yêu cầu cho món ${itemId} để tiến hành xét chọn.`);
    showNotification(`Đã đóng đợt nhận yêu cầu cho món ${itemId}.`, 'info');
  };

  // Bốc thăm xét chọn người nhận - Cloud-First
  const conductLottery = async (itemId, seed = 'LE-LOI-LOOP-KHKT-2026') => {
    if (currentUser.role !== 'teacher' && currentUser.role !== 'station_staff' && currentUser.role !== 'admin') {
      showNotification('Từ chối quyền: Chỉ Giáo viên hoặc Quản sinh mới có quyền kích hoạt bốc thăm!', 'error');
      return;
    }

    const itemRequests = requests.filter(r => r.itemId === itemId && r.status !== 'rejected');
    if (itemRequests.length === 0) {
      showNotification('Không có yêu cầu nào hợp lệ để bốc thăm!', 'error');
      return;
    }

    const rankedRequests = runLotteryWithSeed(itemRequests, seed);
    const winner = rankedRequests.find(r => r.status === 'selected');

    if (isSupabaseConfigured && supabase) {
      try {
        const reqUpdates = rankedRequests.map(rr => 
          supabase.from('requests').update({ status: rr.status, lottery_rank: rr.lotteryRank }).eq('id', rr.id)
        );
        const itemUpdate = supabase.from('items').update({ status: 'matching', request_status: 'closed' }).eq('id', itemId);

        const results = await Promise.all([...reqUpdates, itemUpdate]);
        const hasError = results.some(res => res.error);
        if (hasError) {
          setSyncStatus('sync_error');
          showNotification('Lỗi lưu kết quả bốc thăm lên Cloud Database!', 'error');
          return;
        }
      } catch (err) {
        console.error(err);
        setSyncStatus('sync_error');
        showNotification(`Lỗi kết nối khi bốc thăm: ${err.message}`, 'error');
        return;
      }
    }

    setRequests(prev => prev.map(r => {
      const match = rankedRequests.find(rr => rr.id === r.id);
      return match ? match : r;
    }));

    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, status: 'matching', requestStatus: 'closed' };
      }
      return item;
    }));

    addLog('BỐC THĂM XÉT CHỌN', `Bốc thăm ngẫu nhiên (Seed: ${seed}) cho món ${itemId}: Chọn chính thức học sinh ${winner?.requesterName} (${winner?.requesterId}), ${rankedRequests.length - 1} học sinh dự phòng.`);
    showNotification(`Đã chọn được người nhận chính thức: ${winner?.requesterName} (${winner?.requesterId})!`, 'success');
  };

  // Chọn thủ công 1 người nhận (GV / Trực trạm) - Cloud-First
  const selectRecipientManually = async (requestId) => {
    if (currentUser.role !== 'teacher' && currentUser.role !== 'station_staff' && currentUser.role !== 'admin') {
      showNotification('Từ chối quyền: Chỉ Giáo viên hoặc Quản sinh mới có quyền chọn người nhận thủ công!', 'error');
      return;
    }

    const req = requests.find(r => r.id === requestId);
    if (!req) return;

    if (isSupabaseConfigured && supabase) {
      try {
        const [winnerRes, backupRes, itemRes] = await Promise.all([
          supabase.from('requests').update({ status: 'selected', lottery_rank: 1 }).eq('id', requestId),
          supabase.from('requests').update({ status: 'backup', lottery_rank: 2 }).eq('item_id', req.itemId).neq('id', requestId),
          supabase.from('items').update({ status: 'matching', request_status: 'closed' }).eq('id', req.itemId)
        ]);

        if (winnerRes.error || backupRes.error || itemRes.error) {
          setSyncStatus('sync_error');
          showNotification('Lỗi cập nhật người nhận trên Cloud Database!', 'error');
          return;
        }
      } catch (err) {
        console.error(err);
        setSyncStatus('sync_error');
        showNotification(`Lỗi kết nối Cloud: ${err.message}`, 'error');
        return;
      }
    }

    setRequests(prev => prev.map(r => {
      if (r.itemId === req.itemId) {
        return {
          ...r,
          status: r.id === requestId ? 'selected' : 'backup',
          lotteryRank: r.id === requestId ? 1 : 2
        };
      }
      return r;
    }));

    setItems(prev => prev.map(i => {
      if (i.id === req.itemId) {
        return { ...i, status: 'matching', requestStatus: 'closed' };
      }
      return i;
    }));

    addLog('CHỌN NGƯỜI NHẬN', `Giáo viên/Đội trực đã duyệt chọn thủ công bạn ${req.requesterName} (${req.requesterId}) nhận món ${req.itemId}.`);
    showNotification(`Đã duyệt trao món ${req.itemId} cho bạn ${req.requesterName}!`, 'success');
  };

  // Người cho (Donor B) đồng ý trao món đồ cho Người nhận (A) - Cloud-First qua RPC nguyên tử
  const acceptRequestByDonor = async (requestId) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return;
    const itm = items.find(i => i.id === req.itemId);

    // Xác minh quyền: Bắt buộc là người đăng món (donor_id) hoặc giáo viên/admin
    if (itm && itm.donorId !== currentUser.id && currentUser.role !== 'teacher' && currentUser.role !== 'admin') {
      showNotification('Từ chối quyền: Bạn không phải người đăng món đồ này!', 'error');
      return;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('rpc_accept_request_by_donor', {
          p_request_id: requestId
        });

        if (rpcErr) {
          setSyncStatus('sync_error');
          showNotification(`Lỗi giao dịch Cloud (RPC): ${rpcErr.message}. Thao tác bị hủy để bảo đảm an toàn dữ liệu.`, 'error');
          return;
        }
      } catch (err) {
        console.error('Supabase acceptRequestByDonor error:', err);
        setSyncStatus('sync_error');
        showNotification(`Lỗi kết nối RPC: ${err.message}`, 'error');
        return;
      }
    }

    // Chỉ cập nhật state khi DB/RPC đã xác nhận thành công
    setRequests(prev => prev.map(r => {
      if (r.itemId === req.itemId) {
        return {
          ...r,
          status: r.id === requestId ? 'selected' : 'backup',
          lotteryRank: r.id === requestId ? 1 : 2
        };
      }
      return r;
    }));

    setItems(prev => prev.map(i => {
      if (i.id === req.itemId) {
        return { ...i, status: 'matching', requestStatus: 'closed' };
      }
      return i;
    }));

    addLog('NGƯỜI CHO ĐỒNG Ý TRAO', `Người tặng ${currentUser.name} (${currentUser.id}) đã đồng ý trao tặng món "${itm?.title || req.itemId}" cho bạn ${req.requesterName} (${req.requesterId}). Chuyển sang khâu xếp lịch LoopMatch.`);
    showNotification(`Bạn đã đồng ý trao tặng món đồ cho ${req.requesterName}! Chuyển sang điều phối lịch.`, 'success');

    createNotification({
      recipientId: req.requesterId,
      senderId: currentUser.id,
      senderName: `${currentUser.name} (${currentUser.class})`,
      type: 'request_accepted',
      title: 'Yêu cầu được chấp thuận! 🎉',
      message: `Bạn ${currentUser.name} đã đồng ý trao tặng món "${itm?.title || req.itemId}" cho bạn! Vui lòng theo dõi lịch hẹn.`,
      itemId: req.itemId,
      requestId: req.id
    });
  };

  // Người cho (Donor B) từ chối yêu cầu từ Người nhận - Cloud-First
  const rejectRequestByDonor = async (requestId, reason = 'Người cho đã chọn ứng viên khác') => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return;
    const itm = items.find(i => i.id === req.itemId);

    if (itm && itm.donorId !== currentUser.id && currentUser.role !== 'teacher' && currentUser.role !== 'admin') {
      showNotification('Từ chối quyền: Bạn không phải người đăng món đồ này!', 'error');
      return;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('requests').update({ status: 'rejected' }).eq('id', requestId);
        if (error) {
          setSyncStatus('sync_error');
          showNotification(`Lỗi từ chối yêu cầu trên Cloud: ${error.message}`, 'error');
          return;
        }
      } catch (err) {
        console.error(err);
        setSyncStatus('sync_error');
        showNotification(`Lỗi kết nối Cloud: ${err.message}`, 'error');
        return;
      }
    }

    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return { ...r, status: 'rejected', rejectReason: reason };
      }
      return r;
    }));

    addLog('TỪ CHỐI YÊU CẦU NHẬN', `Người tặng ${currentUser.name} từ chối yêu cầu của ${req?.requesterName} cho món ${req?.itemId}. Lý do: ${reason}`);
    showNotification(`Đã từ chối yêu cầu nhận của ${req?.requesterName}.`, 'info');
  };

  // Điều phối & Chốt lịch hẹn (Tạo appointment) - Cloud-First
  const confirmAppointment = async ({
    itemId,
    requestId,
    donorId,
    requesterId,
    type,
    donorSlot,
    requesterSlot,
    notes = ''
  }) => {
    const aptId = genUniqueId('APT');
    const pickupCode = generatePickupCode();

    const newAppointment = {
      id: aptId,
      itemId,
      requestId,
      donorId,
      requesterId,
      type,
      donorSlot,
      requesterSlot,
      storageSlot: null,
      pickupCode,
      status: 'scheduled',
      donorArrivedAt: null,
      pickedUpAt: null,
      notes: notes || (type === 'direct' ? 'Trao nhận trực tiếp cùng ca tại trạm.' : 'Người cho gửi đồ trước, trạm cất giữ, người nhận đến lấy sau.')
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const [aptRes, itemRes] = await Promise.all([
          supabase.from('appointments').insert([mapAppointmentToDb(newAppointment)]),
          supabase.from('items').update({ status: 'matching' }).eq('id', itemId)
        ]);

        if (aptRes.error || itemRes.error) {
          setSyncStatus('sync_error');
          showNotification(`Lỗi lưu lịch hẹn lên Cloud Database: ${(aptRes.error || itemRes.error).message}`, 'error');
          return null;
        }
      } catch (err) {
        console.error(err);
        setSyncStatus('sync_error');
        showNotification(`Lỗi kết nối khi chốt lịch: ${err.message}`, 'error');
        return null;
      }
    }

    setAppointments(prev => [newAppointment, ...prev]);

    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, status: 'matching' };
      }
      return item;
    }));

    addLog('CHỐT LỊCH HẸN', `Chốt lịch hẹn ${aptId} cho món ${itemId}. Mã nhận đồ phát hành: ${pickupCode}. Hình thức: ${type === 'direct' ? 'Trực tiếp' : 'Lưu tạm'}.`);
    showNotification(`Đã chốt lịch hẹn thành công! Mã nhận: ${pickupCode}`, 'success');

    return newAppointment;
  };

  // Đổi lịch hẹn - Cloud-First
  const rescheduleAppointment = async (aptId, newDonorSlot, newRequesterSlot, newType) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('appointments').update({
          donor_slot: newDonorSlot,
          requester_slot: newRequesterSlot,
          type: newType
        }).eq('id', aptId);

        if (error) {
          setSyncStatus('sync_error');
          showNotification(`Lỗi đổi lịch hẹn trên Cloud: ${error.message}`, 'error');
          return;
        }
      } catch (err) {
        console.error(err);
        setSyncStatus('sync_error');
        showNotification(`Lỗi kết nối khi đổi lịch: ${err.message}`, 'error');
        return;
      }
    }

    setAppointments(prev => prev.map(apt => {
      if (apt.id === aptId) {
        return {
          ...apt,
          donorSlot: newDonorSlot,
          requesterSlot: newRequesterSlot,
          type: newType,
          notes: `${apt.notes} [Đã đổi lịch sang ca mới]`
        };
      }
      return apt;
    }));
    addLog('ĐỔI LỊCH HẸN', `Cập nhật lại lịch hẹn cho mã ${aptId}.`);
    showNotification(`Đã cập nhật lịch hẹn ${aptId}.`, 'info');
  };

  // Hủy lịch hẹn - Cloud-First
  const cancelAppointment = async (aptId, reason) => {
    const apt = appointments.find(a => a.id === aptId);
    if (!apt) return;

    if (isSupabaseConfigured && supabase) {
      try {
        const [aptRes, itemRes] = await Promise.all([
          supabase.from('appointments').update({ status: 'cancelled' }).eq('id', aptId),
          supabase.from('items').update({ status: 'approved', request_status: 'open' }).eq('id', apt.itemId)
        ]);

        if (aptRes.error || itemRes.error) {
          setSyncStatus('sync_error');
          showNotification(`Lỗi hủy lịch hẹn trên Cloud: ${(aptRes.error || itemRes.error).message}`, 'error');
          return;
        }
      } catch (err) {
        console.error(err);
        setSyncStatus('sync_error');
        showNotification(`Lỗi kết nối khi hủy lịch: ${err.message}`, 'error');
        return;
      }
    }

    setAppointments(prev => prev.map(a => {
      if (a.id === aptId) {
        return { ...a, status: 'cancelled', cancelReason: reason };
      }
      return a;
    }));

    setItems(prev => prev.map(i => {
      if (i.id === apt.itemId) {
        return { ...i, status: 'approved', requestStatus: 'open' };
      }
      return i;
    }));

    addLog('HỦY LỊCH HẸN', `Hủy lịch hẹn ${aptId}. Lý do: ${reason}`);
    showNotification(`Đã hủy lịch hẹn ${aptId}. Món đồ đã mở lại yêu cầu.`, 'warning');
  };

  // Tab D: Tiếp nhận & Kiểm tra thực tế tại trạm - Cloud-First qua RPC nguyên tử
  const inspectAndReceiveItem = async ({
    aptId,
    passed,
    note,
    storageSlot
  }) => {
    if (currentUser.role !== 'station_staff' && currentUser.role !== 'teacher' && currentUser.role !== 'admin') {
      showNotification('Từ chối quyền: Chỉ Quản sinh Trạm hoặc Giáo viên mới có quyền kiểm định đồ!', 'error');
      return false;
    }

    const apt = appointments.find(a => a.id === aptId);
    if (!apt) return false;

    // Chống Race Condition ô kệ phía client
    if (passed && apt.type !== 'direct' && storageSlot) {
      const isOccupied = items.some(i => i.status === 'stored' && i.storageSlot === storageSlot && i.id !== apt.itemId);
      if (isOccupied) {
        showNotification(`Ô kệ ${storageSlot} hiện đã có đồ lưu trữ! Vui lòng chọn ô khác.`, 'error');
        return false;
      }
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('rpc_inspect_and_receive_item', {
          p_apt_id: aptId,
          p_passed: passed,
          p_note: note,
          p_storage_slot: passed && apt.type !== 'direct' ? storageSlot : null
        });

        if (rpcErr) {
          setSyncStatus('sync_error');
          showNotification(`Lỗi giao dịch kiểm định (RPC): ${rpcErr.message}. Thao tác bị hủy.`, 'error');
          return false;
        }
      } catch (err) {
        console.error('Supabase inspectAndReceiveItem error:', err);
        setSyncStatus('sync_error');
        showNotification(`Lỗi kết nối RPC kiểm định: ${err.message}`, 'error');
        return false;
      }
    }

    // Cập nhật state sau khi DB xác nhận thành công
    if (passed) {
      const isDirect = apt.type === 'direct';
      setAppointments(prev => prev.map(a => {
        if (a.id === aptId) {
          return {
            ...a,
            status: 'ready_for_pickup',
            donorArrivedAt: now,
            storageSlot: isDirect ? null : storageSlot,
            notes: `${a.notes} - Đạt kiểm tra: ${note}`
          };
        }
        return a;
      }));

      setItems(prev => prev.map(i => {
        if (i.id === apt.itemId) {
          return {
            ...i,
            status: isDirect ? 'matching' : 'stored',
            storageSlot: isDirect ? null : storageSlot,
            qualityCheck: { passed: true, note, checkedBy: currentUser.id }
          };
        }
        return i;
      }));

      addLog('KIỂM TRA ĐẠT & LƯU TRẠM', `Kiểm tra đạt món ${apt.itemId} tại trạm. Đã lưu ${isDirect ? 'Bàn giao trực tiếp' : 'ô ' + storageSlot}. Người kiểm tra: ${currentUser.name}.`);
      showNotification(`Món ${apt.itemId} ĐẠT kiểm tra! Sẵn sàng bàn giao cho người nhận.`, 'success');
      return true;
    } else {
      setAppointments(prev => prev.map(a => {
        if (a.id === aptId) {
          return {
            ...a,
            status: 'failed_inspection',
            notes: `Không đạt kiểm tra: ${note}`
          };
        }
        return a;
      }));

      setItems(prev => prev.map(i => {
        if (i.id === apt.itemId) {
          return {
            ...i,
            status: 'rejected',
            rejectReason: `Không đạt kiểm tra thực tế: ${note}`,
            qualityCheck: { passed: false, note, checkedBy: currentUser.id }
          };
        }
        return i;
      }));

      addLog('KIỂM TRA KHÔNG ĐẠT', `Món ${apt.itemId} KHÔNG ĐẠT kiểm tra thực tế. Lý do: ${note}. Đã hoàn trả cho người gửi.`);
      showNotification(`Món ${apt.itemId} không đạt kiểm tra. Đã ghi nhận lý do.`, 'error');
      return false;
    }
  };

  // Tab E: Bàn giao đồ & Vô hiệu hóa mã nhận - Cloud-First qua RPC nguyên tử
  const completeHandover = async (enteredCode) => {
    if (currentUser.role !== 'station_staff' && currentUser.role !== 'teacher' && currentUser.role !== 'admin') {
      return { success: false, message: 'Từ chối quyền: Chỉ Quản sinh Trạm hoặc Giáo viên mới có quyền bàn giao đồ!' };
    }

    const trimmedCode = enteredCode.trim().toUpperCase();
    const apt = appointments.find(a => a.pickupCode.toUpperCase() === trimmedCode);

    if (!apt) {
      return { success: false, message: 'Mã nhận đồ không tồn tại trong hệ thống!' };
    }

    if (apt.status === 'completed') {
      return { success: false, message: 'Mã nhận đồ này ĐÃ ĐƯỢC BÀN GIAO trước đó và đã bị vô hiệu hóa an toàn!' };
    }

    if (apt.status === 'cancelled' || apt.status === 'failed_inspection') {
      return { success: false, message: 'Lịch hẹn này đã bị hủy hoặc đồ không đạt kiểm định!' };
    }

    const item = items.find(i => i.id === apt.itemId);
    if (!item?.qualityCheck?.passed) {
      return { success: false, message: 'Món đồ CHƯA QUA kiểm tra thực tế tại trạm, không thể bàn giao!' };
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('rpc_complete_handover', {
          p_pickup_code: trimmedCode
        });

        if (rpcErr) {
          setSyncStatus('sync_error');
          return { success: false, message: `Lỗi bàn giao Cloud (RPC): ${rpcErr.message}` };
        }
      } catch (err) {
        console.error('Supabase completeHandover error:', err);
        setSyncStatus('sync_error');
        return { success: false, message: `Lỗi kết nối RPC bàn giao: ${err.message}` };
      }
    }

    // Chỉ cập nhật state khi DB/RPC xác nhận thành công
    setAppointments(prev => prev.map(a => {
      if (a.id === apt.id) {
        return {
          ...a,
          status: 'completed',
          pickedUpAt: now,
          storageSlot: null
        };
      }
      return a;
    }));

    setItems(prev => prev.map(i => {
      if (i.id === apt.itemId) {
        return {
          ...i,
          status: 'completed',
          storageSlot: null
        };
      }
      return i;
    }));

    addLog('BÀN GIAO THÀNH CÔNG', `Đã bàn giao món ${apt.itemId} (${item.title}) cho ${apt.requesterId}. Mã ${apt.pickupCode} đã vô hiệu hóa. Giải phóng kệ trạm.`);
    showNotification(`Bàn giao thành công món ${item.title}! Mã nhận đã được vô hiệu hóa an toàn.`, 'success');

    return {
      success: true,
      appointment: apt,
      item: item,
      message: 'Bàn giao đồ thành công!'
    };
  };

  const occupiedSlots = items
    .filter(i => i.status === 'stored' && i.storageSlot)
    .map(i => ({ slot: i.storageSlot, item: i }));

  const occupiedSlotCount = occupiedSlots.length;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        authUser,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        signOut,
        switchRole,
        resetToSeedData,
        uploadSeedToSupabase,
        isSupabaseConfigured,
        dbConnected,
        isSyncing,
        syncStatus,
        syncError,
        loadDataFromSupabase,
        users: USERS,
        items,
        requests,
        appointments,
        logs,
        notifications,
        createNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        occupiedSlots,
        occupiedSlotCount,
        maxCapacity: 10,
        addItem,
        approveItem,
        rejectItem,
        requestItemUpdate,
        addRequest,
        closeItemRegistration,
        conductLottery,
        selectRecipientManually,
        acceptRequestByDonor,
        rejectRequestByDonor,
        confirmAppointment,
        rescheduleAppointment,
        cancelAppointment,
        inspectAndReceiveItem,
        completeHandover,
        addLog,
        notification,
        showNotification
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
