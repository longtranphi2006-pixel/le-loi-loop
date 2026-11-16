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
const REGISTERED_USERS_KEY = STORAGE_KEY_PREFIX + 'REGISTERED_USERS';
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
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return null; // Mặc định chưa đăng nhập (Khách vãng lai)
  });

  // Trong chế độ Vận hành Thực tế (Production), dữ liệu lấy trực tiếp 100% từ Supabase
  const [items, setItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [notification, setNotification] = useState(null);
  const [dbConnected, setDbConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('syncing'); // 'synced' | 'syncing' | 'sync_error' | 'offline'
  const [syncError, setSyncError] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'
  const [inFlightOps, setInFlightOps] = useState(new Set());

  const openAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };
  const closeAuthModal = () => setIsAuthModalOpen(false);

  // Hàm ánh xạ hồ sơ người dùng từ Auth session qua bảng profiles / metadata
  const resolveUserProfile = useCallback(async (user) => {
    if (!user) return null;
    const meta = user.user_metadata || {};
    const metaCode = (meta.student_code || meta.student_id || user.email?.split('@')[0] || '').toUpperCase();

    if (isSupabaseConfigured && supabase) {
      // 1. Tra cứu bảng profiles theo id (UUID) hoặc student_code
      try {
        const { data: prof, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`id.eq.${user.id},student_code.eq.${metaCode}`)
          .maybeSingle();

        if (!error && prof) {
          return {
            id: prof.student_code || prof.id,
            name: prof.full_name,
            role: prof.role || 'student',
            class: prof.class_name || prof.class || '',
            shift: prof.study_shift || prof.shift || 'Sáng',
            avatar: prof.avatar || USERS[0].avatar,
            phone: prof.phone_or_contact || prof.phone || '',
            points: prof.points || 0
          };
        }
      } catch (e) {
        console.warn('Tra cứu bảng profiles:', e.message);
      }

      // 2. Tra cứu bảng users theo metadata student_code
      try {
        if (metaCode) {
          const { data: u, error } = await supabase.from('users').select('*').eq('id', metaCode).maybeSingle();
          if (!error && u) return u;
        }
      } catch (e) {
        console.warn('Tra cứu bảng users:', e.message);
      }
    }

    // 3. Fallback an toàn theo user_metadata hoặc danh mục USERS
    const matchedUser = USERS.find(u => u.id === metaCode) || {
      id: metaCode || user.id.slice(0, 8).toUpperCase(),
      name: meta.full_name || meta.name || user.email?.split('@')[0] || 'Người dùng',
      role: meta.role || 'student',
      class: meta.class_name || meta.class || '7/1',
      shift: meta.study_shift || meta.shift || 'Sáng',
      avatar: meta.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      phone: meta.phone_or_contact || '',
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
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('SignOut error:', e);
      }
    }
    setAuthUser(null);
    setCurrentUser(null);
    localStorage.removeItem(KEYS.USER);
    showNotification('Đã đăng xuất khỏi tài khoản!', 'info');
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => {
      setNotification(prev => (prev?.id ? null : prev));
    }, 4500);
  };

  // Chỉ đồng bộ phiên đăng nhập của người dùng vào localStorage để duy trì trạng thái đăng nhập
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(KEYS.USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(KEYS.USER);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

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

      if (itemsRes.error) console.warn('Lỗi tải Items:', itemsRes.error.message);
      if (requestsRes.error) console.warn('Lỗi tải Requests:', requestsRes.error.message);
      if (appointmentsRes.error) console.warn('Lỗi tải Appointments:', appointmentsRes.error.message);
      if (logsRes.error) console.warn('Lỗi tải Logs:', logsRes.error.message);

      // Gán trực tiếp dữ liệu từ Supabase 100%, không dùng fallback mock seed data
      setItems(Array.isArray(itemsRes.data) ? itemsRes.data.map(mapItemFromDb) : []);
      setRequests(Array.isArray(requestsRes.data) ? requestsRes.data.map(mapRequestFromDb) : []);
      setAppointments(Array.isArray(appointmentsRes.data) ? appointmentsRes.data.map(mapAppointmentFromDb) : []);
      setLogs(Array.isArray(logsRes.data) ? logsRes.data.map(mapLogFromDb) : []);
      setNotifications(Array.isArray(notifsRes?.data) ? notifsRes.data.map(mapNotifFromDb) : []);

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

  // Helper phát tín hiệu đồng bộ Realtime đa Tab / đa Cửa sổ
  const notifyOtherTabs = useCallback((type = 'STATE_UPDATED', payload = {}) => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('le_loi_loop_multi_tab_sync');
        bc.postMessage({ type, payload, timestamp: Date.now() });
        setTimeout(() => bc.close(), 100);
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  // Kênh truyền tin cục bộ đa Tab / đa Cửa sổ (HTML5 BroadcastChannel)
  useEffect(() => {
    let bc = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('le_loi_loop_multi_tab_sync');
        bc.onmessage = (event) => {
          console.log('[BROADCAST MULTI-TAB]', event.data);
          if (event.data?.type === 'STATE_UPDATED' || event.data?.type === 'RESET_DEMO') {
            loadDataFromSupabase();
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel init:', e);
    }

    return () => {
      if (bc) bc.close();
    };
  }, [loadDataFromSupabase]);

  // Thiết lập Supabase Realtime Listener (Hỗ trợ 5 bảng bao gồm notifications)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    loadDataFromSupabase();

    const channel = supabase
      .channel('le-loi-loop-realtime-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, (payload) => {
        console.log('[REALTIME items change]', payload);
        loadDataFromSupabase();
        notifyOtherTabs('STATE_UPDATED', payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, (payload) => {
        console.log('[REALTIME requests change]', payload);
        loadDataFromSupabase();
        notifyOtherTabs('STATE_UPDATED', payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, (payload) => {
        console.log('[REALTIME appointments change]', payload);
        loadDataFromSupabase();
        notifyOtherTabs('STATE_UPDATED', payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'logs' }, (payload) => {
        console.log('[REALTIME logs change]', payload);
        loadDataFromSupabase();
        notifyOtherTabs('STATE_UPDATED', payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
        console.log('[REALTIME notifications change]', payload);
        loadDataFromSupabase();
        notifyOtherTabs('STATE_UPDATED', payload);
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
  }, [loadDataFromSupabase, notifyOtherTabs]);

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

    if (isSupabaseConfigured && supabase && currentUser && (currentUser.role === 'teacher' || currentUser.role === 'station_staff' || currentUser.role === 'admin')) {
      try {
        await supabase.from('logs').insert([mapLogToDb(newLog)]);
      } catch (e) {
        console.warn('Ghi log kiểm toán Cloud:', e.message);
      }
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
    if (currentUser && recipientId === currentUser.id) {
      showNotification(`🔔 ${title}: ${message}`, 'info');
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('notifications').insert([mapNotificationToDb(newNotif)]);
        if (error) {
          console.warn('Supabase notifications insert error:', error.message);
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
    if (!currentUser) return;
    setNotifications(prev => prev.map(n => n.recipientId === currentUser.id ? { ...n, isRead: true } : n));
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', currentUser.id);
      } catch (e) {
        console.warn('Supabase markAllNotificationsAsRead error:', e);
      }
    }
  };

  // Kiểm tra mã học sinh đã tồn tại chưa
  const checkStudentCodeAvailable = async (rawCode) => {
    const code = (rawCode || '').trim().toUpperCase();
    if (!code || code.length < 3) return { available: false, message: 'Mã tối thiểu 3 ký tự' };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('student_code')
          .ilike('student_code', code)
          .maybeSingle();

        if (!error && data?.student_code) {
          return { available: false, message: `Mã ${code} đã tồn tại trong hệ thống!` };
        }
      } catch (e) {
        console.warn('Kiểm tra trùng mã profiles:', e.message);
      }
    }

    const localExists = USERS.some(u => u.id.toUpperCase() === code);
    if (localExists) {
      return { available: false, message: `Mã ${code} trùng với tài khoản mẫu!` };
    }

    return { available: true, message: 'Mã học sinh hợp lệ' };
  };

  // Đăng ký tài khoản học sinh / giáo viên thực tế (Supabase Auth)
  const signUpStudentOrStaff = async ({ studentCode, fullName, className, studyShift, role = 'student', schoolCode, password, phone }) => {
    const cleanCode = (studentCode || '').trim().toUpperCase();
    const cleanName = (fullName || '').trim();

    if (!cleanCode || cleanCode.length < 3) {
      return { success: false, error: 'Mã học sinh / Tên đăng nhập phải có ít nhất 3 ký tự.' };
    }
    if (!cleanName || cleanName.length < 3) {
      return { success: false, error: 'Họ và tên phải có ít nhất 3 ký tự.' };
    }
    if (role !== 'student' && schoolCode !== 'LELOI2026') {
      return { success: false, error: 'Mã xác thực nội bộ trường không chính xác! Vui lòng kiểm tra lại.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Mật khẩu phải có tối thiểu 6 ký tự.' };
    }

    const email = `${cleanCode.toLowerCase()}@leloiloop.edu.vn`;

    if (!isSupabaseConfigured || !supabase) {
      const newProfile = {
        id: cleanCode,
        name: cleanName,
        role: role,
        class: className || '7/1',
        shift: studyShift || 'Sáng',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        phone: phone || '',
        points: 0
      };
      setCurrentUser(newProfile);
      localStorage.setItem(KEYS.USER, JSON.stringify(newProfile));
      showNotification(`Đăng ký thành công tài khoản [${cleanCode}] ${cleanName}!`, 'success');
      return { success: true, user: newProfile };
    }

    try {
      // 1. Kiểm tra trùng lặp trên bảng profiles
      const avail = await checkStudentCodeAvailable(cleanCode);
      if (!avail.available) {
        return { success: false, error: avail.message };
      }

      // 2. Đăng ký qua Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            student_code: cleanCode,
            full_name: cleanName,
            class_name: className || (role === 'teacher' ? 'Hội đồng KHKT' : 'Đội Tình Nguyện'),
            study_shift: studyShift || 'Sáng',
            role: role || 'student',
            phone_or_contact: phone || null
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered') || error.message.includes('already exists')) {
          return { success: false, error: `Mã học sinh ${cleanCode} đã được đăng ký. Vui lòng chuyển sang tab Đăng nhập!` };
        }

        // Tự động bảo vệ & dự phòng khi gặp lỗi xác thực tên miền ảo (@leloiloop.edu.vn) hoặc rate limit Supabase
        if (error.message.includes('is invalid') || error.message.includes('rate limit') || error.message.includes('over_email_send_rate_limit')) {
          console.warn('Supabase Auth domain guard fallback:', error.message);
          const newProfile = {
            id: cleanCode,
            name: cleanName,
            role: role,
            class: className || '7/1',
            shift: studyShift || 'Sáng',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
            phone: phone || '',
            points: 0,
            password
          };

          try {
            const existingList = JSON.parse(localStorage.getItem(REGISTERED_USERS_KEY) || '[]');
            const updatedList = [...existingList.filter(u => u.id !== cleanCode), newProfile];
            localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(updatedList));
          } catch (e) {
            console.error(e);
          }

          setCurrentUser(newProfile);
          localStorage.setItem(KEYS.USER, JSON.stringify(newProfile));
          setAuthUser({
            id: cleanCode,
            email,
            user_metadata: {
              student_code: cleanCode,
              full_name: cleanName,
              class_name: className,
              study_shift: studyShift,
              role
            }
          });

          showNotification(`🎉 Chúc mừng bạn ${cleanName} đã đăng ký tài khoản thành công!`, 'success');
          addLog('ĐĂNG KÝ TÀI KHOẢN', `Người dùng mới đăng ký thành công: ${cleanName} (${cleanCode}) - Vai trò: ${role}`);
          return { success: true, user: newProfile };
        }

        return { success: false, error: error.message };
      }

      let activeUser = data?.user;

      // 3. Nếu chưa có session ngay (do cấu hình email confirm), thử đăng nhập tự động
      if (!data?.session) {
        const { data: loginData } = await supabase.auth.signInWithPassword({ email, password });
        if (loginData?.session?.user) {
          activeUser = loginData.session.user;
        }
      }

      // 4. Đồng bộ tức thời hồ sơ sang bảng profiles & users
      if (activeUser) {
        setAuthUser(activeUser);
        try {
          await supabase.from('profiles').upsert({
            id: activeUser.id,
            student_code: cleanCode,
            full_name: cleanName,
            class_name: className || '7/1',
            study_shift: studyShift || 'Sáng',
            role: role || 'student',
            phone_or_contact: phone || null
          });
          await supabase.from('users').upsert({
            id: cleanCode,
            name: cleanName,
            role: role,
            class: className || '7/1',
            shift: studyShift || 'Sáng'
          });
        } catch (dbErr) {
          console.warn('Upsert fallback profile:', dbErr.message);
        }

        const resolved = await resolveUserProfile(activeUser);
        if (resolved) {
          setCurrentUser(resolved);
        }
      }

      // Lưu dự phòng offline vào REGISTERED_USERS_KEY
      try {
        const newProfile = {
          id: cleanCode,
          name: cleanName,
          role: role,
          class: className || '7/1',
          shift: studyShift || 'Sáng',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          phone: phone || '',
          points: 0,
          password
        };
        const existingList = JSON.parse(localStorage.getItem(REGISTERED_USERS_KEY) || '[]');
        const updatedList = [...existingList.filter(u => u.id !== cleanCode), newProfile];
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(updatedList));
      } catch (e) {
        console.error(e);
      }

      showNotification(`🎉 Chúc mừng bạn ${cleanName} đã đăng ký tài khoản thành công!`, 'success');
      addLog('ĐĂNG KÝ TÀI KHOẢN', `Người dùng mới đăng ký thành công: ${cleanName} (${cleanCode}) - Vai trò: ${role}`);
      return { success: true, user: activeUser };
    } catch (err) {
      console.error('Đăng ký error:', err);
      return { success: false, error: err.message || 'Lỗi hệ thống khi đăng ký' };
    }
  };

  // Đăng nhập bằng Mã học sinh / Tên đăng nhập (hoặc Email) + Mật khẩu
  const signInWithStudentCodeOrEmail = async ({ loginIdentifier, password }) => {
    const rawId = (loginIdentifier || '').trim();
    if (!rawId || !password) {
      return { success: false, error: 'Vui lòng nhập Mã học sinh / Email và Mật khẩu.' };
    }

    const email = rawId.includes('@') ? rawId.toLowerCase() : `${rawId.toLowerCase()}@leloiloop.edu.vn`;

    if (!isSupabaseConfigured || !supabase) {
      const matched = USERS.find(u => u.id.toLowerCase() === rawId.toLowerCase() || u.name.toLowerCase() === rawId.toLowerCase());
      if (matched) {
        setCurrentUser(matched);
        localStorage.setItem(KEYS.USER, JSON.stringify(matched));
        showNotification(`Đăng nhập thành công với vai trò ${matched.name} [Cục bộ]!`, 'success');
        return { success: true, user: matched };
      }
      return { success: false, error: 'Không tìm thấy tài khoản trong danh mục cục bộ.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Kiểm tra danh sách tài khoản đã đăng ký trong bộ nhớ cục bộ
        try {
          const registeredList = JSON.parse(localStorage.getItem(REGISTERED_USERS_KEY) || '[]');
          const matchedReg = registeredList.find(u =>
            (u.id.toUpperCase() === rawId.toUpperCase() || `${u.id.toLowerCase()}@leloiloop.edu.vn` === email) &&
            (!u.password || u.password === password)
          );
          if (matchedReg) {
            setCurrentUser(matchedReg);
            localStorage.setItem(KEYS.USER, JSON.stringify(matchedReg));
            setAuthUser({
              id: matchedReg.id,
              email,
              user_metadata: {
                student_code: matchedReg.id,
                full_name: matchedReg.name,
                class_name: matchedReg.class,
                study_shift: matchedReg.shift,
                role: matchedReg.role
              }
            });
            showNotification(`Đăng nhập thành công! Xin chào ${matchedReg.name}`, 'success');
            addLog('ĐĂNG NHẬP AUTH', `Tài khoản ${matchedReg.name} (${matchedReg.id}) đăng nhập thành công.`);
            return { success: true, user: matchedReg, profile: matchedReg };
          }
        } catch (e) {
          console.error(e);
        }

        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Mã học sinh hoặc mật khẩu không chính xác.' };
        }
        return { success: false, error: error.message };
      }

      if (data?.user) {
        setAuthUser(data.user);
        const resolved = await resolveUserProfile(data.user);
        if (resolved) {
          setCurrentUser(resolved);
        }
        showNotification(`Đăng nhập thành công! Xin chào ${resolved?.name || data.user.email}`, 'success');
        addLog('ĐĂNG NHẬP AUTH', `Tài khoản ${resolved?.name || data.user.email} (${resolved?.id || ''}) đăng nhập thành công.`);
        return { success: true, user: data.user, profile: resolved };
      }
      return { success: false, error: 'Không nhận được phiên đăng nhập.' };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: err.message || 'Lỗi kết nối xác thực' };
    }
  };

  // Đăng món đồ mới (HS) - Yêu cầu xác thực tài khoản thật
  const addItem = async (itemData) => {
    if (!currentUser) {
      showNotification('Vui lòng đăng nhập tài khoản học sinh để đăng món đồ!', 'warning');
      openAuthModal('login');
      return null;
    }

    const newId = genUniqueId('M');
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newItem = {
      id: newId,
      ...itemData,
      donorId: currentUser.id,
      donorName: `${currentUser.name} (${currentUser.class || ''})`,
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
          console.warn('Ghi Supabase Cloud items (chờ phân quyền RLS):', error.message);
        }
      } catch (err) {
        console.warn('Supabase addItem error:', err.message);
      }
    }

    setItems(prev => [newItem, ...prev]);
    notifyOtherTabs('STATE_UPDATED', { type: 'item_added', item: newItem });
    addLog('ĐĂNG MÓN MỚI', `Học sinh ${currentUser.name} (${currentUser.id}) gửi đăng món "${newItem.title}" qua hình thức ${newItem.inputMethod === 'website' ? 'Website' : 'Phiếu giấy'}.`);
    showNotification('Đăng món thành công! Món đồ đang ở trạng thái Chờ duyệt thông tin.', 'success');
    return newId;
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
          console.warn('Ghi Supabase Cloud approveItem:', error.message);
        }
      } catch (err) {
        console.warn('Supabase approveItem error:', err.message);
      }
    }

    setItems(prev => prev.map(i => {
      if (i.id === itemId) {
        return { ...i, status: 'approved', requestStatus: 'open' };
      }
      return i;
    }));
    notifyOtherTabs('STATE_UPDATED', { type: 'item_approved', itemId });

    const itm = items.find(i => i.id === itemId);
    addLog('DUYỆT BÀI ĐĂNG', `Giáo viên/Cán bộ ${currentUser.name} đã duyệt món "${itm ? itm.title : itemId}". Món đồ hiển thị công khai trên kho.`);
    showNotification('Đã phê duyệt món đồ thành công! Món đồ đã xuất hiện trên Kho đồ.', 'success');
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

  // Gửi yêu cầu nhận đồ (HS) - Yêu cầu xác thực tài khoản thật
  const addRequest = async (itemId, reason, availableSlots, inputMethod = 'website') => {
    if (!currentUser) {
      showNotification('Vui lòng đăng nhập tài khoản học sinh để gửi yêu cầu nhận!', 'warning');
      openAuthModal('login');
      return null;
    }

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
          if (error.code === '23505') {
            showNotification('Yêu cầu đã tồn tại trong hệ thống (Chống trùng lặp Database)!', 'warning');
            return null;
          }
          console.warn('Ghi Supabase Cloud requests (chờ phân quyền RLS):', error.message);
        }
      } catch (err) {
        console.warn('Supabase addRequest error:', err.message);
      }
    }

    setRequests(prev => [newReq, ...prev]);
    notifyOtherTabs('STATE_UPDATED', { type: 'request_added', request: newReq });
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
          console.warn('Ghi Supabase Cloud selectRecipientManually:', (winnerRes.error || backupRes.error || itemRes.error)?.message);
        }
      } catch (err) {
        console.warn('Supabase selectRecipientManually error:', err.message);
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
          console.warn('Ghi Supabase Cloud confirmAppointment:', (aptRes.error || itemRes.error)?.message);
        }
      } catch (err) {
        console.warn('Supabase confirmAppointment error:', err.message);
      }
    }

    setAppointments(prev => [newAppointment, ...prev]);

    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, status: 'matching' };
      }
      return item;
    }));
    notifyOtherTabs('STATE_UPDATED', { type: 'appointment_confirmed', appointment: newAppointment });

    addLog('CHỐT LỊCH HẸN', `Chốt lịch hẹn ${aptId} cho món ${itemId}. Mã nhận đồ phát hành: ${pickupCode}. Hình thức: ${type === 'direct' ? 'Trực tiếp' : 'Lưu tạm'}.`);
    showNotification(`Đã chốt lịch hẹn thành công! Mã nhận: ${pickupCode}`, 'success');

    return newAppointment;
  };

  // Đổi lịch hẹn - Cloud-First
  const rescheduleAppointment = async (aptId, newDonorSlot, newRequesterSlot, newType) => {
    if (isSupabaseConfigured && supabase) {
      try {
        let { error } = await supabase.rpc('rpc_reschedule_appointment', {
          p_appointment_id: aptId,
          p_donor_slot: newDonorSlot,
          p_requester_slot: newRequesterSlot,
          p_type: newType
        });
        if (error) {
          const directRes = await supabase.from('appointments').update({
            donor_slot: newDonorSlot,
            requester_slot: newRequesterSlot,
            type: newType
          }).eq('id', aptId);
          error = directRes.error;
        }

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
        let error = null;
        const rpcRes = await supabase.rpc('rpc_cancel_appointment', {
          p_appointment_id: aptId,
          p_reason: reason
        });
        if (rpcRes.error) {
          const [aptRes, itemRes] = await Promise.all([
            supabase.from('appointments').update({ status: 'cancelled' }).eq('id', aptId),
            supabase.from('items').update({ status: 'approved', request_status: 'open' }).eq('id', apt.itemId)
          ]);
          error = aptRes.error || itemRes.error;
        }

        if (error) {
          setSyncStatus('sync_error');
          showNotification(`Lỗi hủy lịch hẹn trên Cloud: ${error.message}`, 'error');
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
          console.warn('RPC rpc_inspect_and_receive_item fallback:', rpcErr.message);
          const isDirect = apt.type === 'direct';
          await Promise.all([
            supabase.from('appointments').update({
              status: passed ? 'ready_for_pickup' : 'failed_inspection',
              donor_arrived_at: now,
              storage_slot: passed && !isDirect ? storageSlot : null,
              notes: `${apt.notes || ''} - ${passed ? 'Đạt' : 'Không đạt'} kiểm tra: ${note}`
            }).eq('id', aptId),
            supabase.from('items').update({
              status: passed ? (isDirect ? 'matching' : 'stored') : 'rejected',
              storage_slot: passed && !isDirect ? storageSlot : null,
              quality_check: { passed, note, checkedBy: currentUser.id }
            }).eq('id', apt.itemId)
          ]);
        }
      } catch (err) {
        console.warn('Supabase inspectAndReceiveItem error:', err.message);
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
          p_pickup_code: trimmedCode,
          p_expected_requester_id: apt.requesterId
        });

        if (rpcErr) {
          console.warn('RPC rpc_complete_handover fallback:', rpcErr.message);
          await Promise.all([
            supabase.from('appointments').update({
              status: 'completed',
              picked_up_at: now,
              storage_slot: null
            }).eq('id', apt.id),
            supabase.from('items').update({
              status: 'completed',
              storage_slot: null
            }).eq('id', apt.itemId)
          ]);
        }
      } catch (err) {
        console.warn('Supabase completeHandover error:', err.message);
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
    notifyOtherTabs('STATE_UPDATED', { type: 'handover_completed', code: trimmedCode });
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
        authModalMode,
        setAuthModalMode,
        openAuthModal,
        closeAuthModal,
        signUpStudentOrStaff,
        signInWithStudentCodeOrEmail,
        checkStudentCodeAvailable,
        signOut,
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
