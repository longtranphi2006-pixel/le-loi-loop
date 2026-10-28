import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  USERS,
  STATION_SLOTS,
  STORAGE_SLOTS,
  CATEGORIES,
  INITIAL_ITEMS,
  INITIAL_REQUESTS,
  INITIAL_APPOINTMENTS,
  INITIAL_LOGS
} from '../data/seedData';
import { generatePickupCode, runLotteryWithSeed } from '../utils/loopMatchAlgorithm';
import {
  supabase,
  isSupabaseConfigured,
  mapItemFromDb,
  mapItemToDb,
  mapRequestFromDb,
  mapRequestToDb,
  mapAppointmentFromDb,
  mapAppointmentToDb,
  mapLogFromDb,
  mapLogToDb
} from '../lib/supabase';

const STORAGE_KEY_PREFIX = 'LE_LOI_LOOP_V1_';
const KEYS = {
  USER: STORAGE_KEY_PREFIX + 'USER',
  ITEMS: STORAGE_KEY_PREFIX + 'ITEMS',
  REQUESTS: STORAGE_KEY_PREFIX + 'REQUESTS',
  APPOINTMENTS: STORAGE_KEY_PREFIX + 'APPOINTMENTS',
  LOGS: STORAGE_KEY_PREFIX + 'LOGS',
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

  const [notification, setNotification] = useState(null);
  const [dbConnected, setDbConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => {
      setNotification(prev => (prev?.id ? null : prev));
    }, 4000);
  };

  // Sync to localStorage as local cache/fallback
  useEffect(() => {
    try {
      localStorage.setItem(KEYS.USER, JSON.stringify(currentUser));
      localStorage.setItem(KEYS.ITEMS, JSON.stringify(items));
      localStorage.setItem(KEYS.REQUESTS, JSON.stringify(requests));
      localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(appointments));
      localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error(e);
    }
  }, [currentUser, items, requests, appointments, logs]);

  // Hàm tải dữ liệu từ Supabase
  const loadDataFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      setIsSyncing(true);
      const [itemsRes, requestsRes, appointmentsRes, logsRes] = await Promise.all([
        supabase.from('items').select('*').order('created_at', { ascending: false }),
        supabase.from('requests').select('*').order('created_at', { ascending: false }),
        supabase.from('appointments').select('*').order('created_at', { ascending: false }),
        supabase.from('logs').select('*').order('timestamp', { ascending: false })
      ]);

      let hasData = false;

      if (!itemsRes.error && itemsRes.data) {
        if (itemsRes.data.length > 0) {
          setItems(itemsRes.data.map(mapItemFromDb));
          hasData = true;
        }
      }

      if (!requestsRes.error && requestsRes.data) {
        if (requestsRes.data.length > 0) {
          setRequests(requestsRes.data.map(mapRequestFromDb));
          hasData = true;
        }
      }

      if (!appointmentsRes.error && appointmentsRes.data) {
        if (appointmentsRes.data.length > 0) {
          setAppointments(appointmentsRes.data.map(mapAppointmentFromDb));
          hasData = true;
        }
      }

      if (!logsRes.error && logsRes.data) {
        if (logsRes.data.length > 0) {
          setLogs(logsRes.data.map(mapLogFromDb));
          hasData = true;
        }
      }

      setDbConnected(true);
      if (hasData) {
        console.log('✓ Supabase: Đồng bộ dữ liệu thành công!');
      }
    } catch (err) {
      console.warn('Supabase fetch error, fallback to local storage:', err);
      setDbConnected(false);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Thiết lập Supabase Realtime Listener
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    loadDataFromSupabase();

    const channel = supabase
      .channel('le-loi-loop-realtime')
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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setDbConnected(true);
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

  const switchRole = (userId) => {
    const target = USERS.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
      showNotification(`Đã chuyển vai trò: ${target.name} [${target.id}]`, 'info');
      addLog('CHUYỂN ĐỔI VAI TRÒ', `Người dùng chuyển sang đóng vai ${target.name} (${target.id})`);
    }
  };

  // Đăng món đồ mới (HS)
  const addItem = async (itemData) => {
    const nextNum = items.length + 1;
    const newId = `M${String(nextNum).padStart(3, '0')}`;
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

    setItems(prev => [newItem, ...prev]);
    addLog('ĐĂNG MÓN MỚI', `Học sinh ${currentUser.name} (${currentUser.id}) gửi đăng món "${newItem.title}" qua hình thức ${newItem.inputMethod === 'website' ? 'Website' : 'Phiếu giấy'}.`);
    showNotification('Đăng món thành công! Món đồ đang ở trạng thái Chờ duyệt thông tin.', 'success');

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('items').insert([mapItemToDb(newItem)]);
      } catch (err) {
        console.error('Supabase addItem error:', err);
      }
    }

    return newId;
  };

  // Phê duyệt món đồ (GV / Đội trực)
  const approveItem = async (itemId) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, status: 'approved', requestStatus: 'open' };
      }
      return item;
    }));
    const itm = items.find(i => i.id === itemId);
    addLog('DUYỆT BÀI ĐĂNG', `Đã duyệt bài đăng món ${itemId} (${itm?.title || ''}). Món đồ hiện đã công khai trên Kho đồ.`);
    showNotification(`Đã phê duyệt món ${itemId} hiển thị trên Kho đồ!`, 'success');

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('items').update({ status: 'approved', request_status: 'open' }).eq('id', itemId);
      } catch (err) {
        console.error('Supabase approveItem error:', err);
      }
    }
  };

  // Từ chối bài đăng
  const rejectItem = async (itemId, reason) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, status: 'rejected', requestStatus: 'closed', rejectReason: reason };
      }
      return item;
    }));
    addLog('TỪ CHỐI BÀI ĐĂNG', `Từ chối món ${itemId}. Lý do: ${reason}`);
    showNotification(`Đã từ chối bài đăng ${itemId}.`, 'error');

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('items').update({ status: 'rejected', request_status: 'closed', reject_reason: reason }).eq('id', itemId);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Yêu cầu bổ sung thông tin
  const requestItemUpdate = async (itemId, note) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, status: 'needs_update', updateNote: note };
      }
      return item;
    }));
    addLog('YÊU CẦU BỔ SUNG', `Yêu cầu bổ sung ảnh/thông tin món ${itemId}: ${note}`);
    showNotification(`Đã gửi yêu cầu bổ sung cho món ${itemId}.`, 'warning');

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('items').update({ status: 'needs_update', update_note: note }).eq('id', itemId);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Gửi yêu cầu nhận đồ (HS)
  const addRequest = async (itemId, reason, availableSlots, inputMethod = 'website') => {
    const nextNum = requests.length + 1;
    const newId = `REQ-${String(nextNum).padStart(3, '0')}`;
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

    setRequests(prev => [newReq, ...prev]);
    const itm = items.find(i => i.id === itemId);
    addLog('GỬI YÊU CẦU NHẬN', `Học sinh ${currentUser.name} (${currentUser.id}) gửi yêu cầu nhận món ${itemId} (${itm?.title || ''}).`);
    showNotification('Đã gửi yêu cầu nhận đồ thành công. Vui lòng theo dõi kết quả xét duyệt!', 'success');

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('requests').insert([mapRequestToDb(newReq)]);
      } catch (err) {
        console.error('Supabase addRequest error:', err);
      }
    }

    return newId;
  };

  // Đóng đợt đăng ký của 1 món
  const closeItemRegistration = async (itemId) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, requestStatus: 'closed' };
      }
      return item;
    }));
    addLog('ĐÓNG ĐỢT ĐĂNG KÝ', `Đóng nhận thêm yêu cầu cho món ${itemId} để tiến hành xét chọn.`);
    showNotification(`Đã đóng đợt nhận yêu cầu cho món ${itemId}.`, 'info');

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('items').update({ request_status: 'closed' }).eq('id', itemId);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Bốc thăm xét chọn người nhận
  const conductLottery = async (itemId, seed = 'LE-LOI-LOOP-KHKT-2026') => {
    const itemRequests = requests.filter(r => r.itemId === itemId && r.status !== 'rejected');
    if (itemRequests.length === 0) {
      showNotification('Không có yêu cầu nào hợp lệ để bốc thăm!', 'error');
      return;
    }

    const rankedRequests = runLotteryWithSeed(itemRequests, seed);
    
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

    const winner = rankedRequests.find(r => r.status === 'selected');
    addLog('BỐC THĂM XÉT CHỌN', `Bốc thăm ngẫu nhiên (Seed: ${seed}) cho món ${itemId}: Chọn chính thức học sinh ${winner?.requesterName} (${winner?.requesterId}), ${rankedRequests.length - 1} học sinh dự phòng.`);
    showNotification(`Đã chọn được người nhận chính thức: ${winner?.requesterName} (${winner?.requesterId})!`, 'success');

    if (isSupabaseConfigured && supabase) {
      try {
        await Promise.all([
          ...rankedRequests.map(rr => supabase.from('requests').update({ status: rr.status, lottery_rank: rr.lotteryRank }).eq('id', rr.id)),
          supabase.from('items').update({ status: 'matching', request_status: 'closed' }).eq('id', itemId)
        ]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Chọn thủ công 1 người nhận
  const selectRecipientManually = async (requestId) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return;

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

    if (isSupabaseConfigured && supabase) {
      try {
        await Promise.all([
          supabase.from('requests').update({ status: 'selected', lottery_rank: 1 }).eq('id', requestId),
          supabase.from('requests').update({ status: 'backup', lottery_rank: 2 }).eq('item_id', req.itemId).neq('id', requestId),
          supabase.from('items').update({ status: 'matching', request_status: 'closed' }).eq('id', req.itemId)
        ]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Điều phối & Chốt lịch hẹn (Tạo appointment)
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
    const aptId = `APT-${Date.now().toString().slice(-4)}`;
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

    setAppointments(prev => [newAppointment, ...prev]);

    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, status: 'matching' };
      }
      return item;
    }));

    addLog('CHỐT LỊCH HẸN', `Chốt lịch hẹn ${aptId} cho món ${itemId}. Mã nhận đồ phát hành: ${pickupCode}. Hình thức: ${type === 'direct' ? 'Trực tiếp' : 'Lưu tạm'}.`);
    showNotification(`Đã chốt lịch hẹn thành công! Mã nhận: ${pickupCode}`, 'success');

    if (isSupabaseConfigured && supabase) {
      try {
        await Promise.all([
          supabase.from('appointments').insert([mapAppointmentToDb(newAppointment)]),
          supabase.from('items').update({ status: 'matching' }).eq('id', itemId)
        ]);
      } catch (err) {
        console.error(err);
      }
    }

    return newAppointment;
  };

  // Đổi lịch hẹn
  const rescheduleAppointment = async (aptId, newDonorSlot, newRequesterSlot, newType) => {
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

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('appointments').update({
          donor_slot: newDonorSlot,
          requester_slot: newRequesterSlot,
          type: newType
        }).eq('id', aptId);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Hủy lịch hẹn
  const cancelAppointment = async (aptId, reason) => {
    setAppointments(prev => prev.map(apt => {
      if (apt.id === aptId) {
        return { ...apt, status: 'cancelled', cancelReason: reason };
      }
      return apt;
    }));

    const apt = appointments.find(a => a.id === aptId);
    if (apt) {
      setItems(prev => prev.map(i => {
        if (i.id === apt.itemId) {
          return { ...i, status: 'approved', requestStatus: 'open' };
        }
        return i;
      }));
    }

    addLog('HỦY LỊCH HẸN', `Hủy lịch hẹn ${aptId}. Lý do: ${reason}`);
    showNotification(`Đã hủy lịch hẹn ${aptId}. Món đồ đã mở lại yêu cầu.`, 'warning');

    if (isSupabaseConfigured && supabase) {
      try {
        await Promise.all([
          supabase.from('appointments').update({ status: 'cancelled' }).eq('id', aptId),
          apt ? supabase.from('items').update({ status: 'approved', request_status: 'open' }).eq('id', apt.itemId) : null
        ]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Tab D: Tiếp nhận & Kiểm tra thực tế tại trạm
  const inspectAndReceiveItem = async ({
    aptId,
    passed,
    note,
    storageSlot
  }) => {
    const apt = appointments.find(a => a.id === aptId);
    if (!apt) return;

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    if (passed) {
      if (apt.type === 'direct') {
        setAppointments(prev => prev.map(a => {
          if (a.id === aptId) {
            return {
              ...a,
              status: 'ready_for_pickup',
              donorArrivedAt: now,
              notes: `${a.notes} - Đạt kiểm tra thực tế: ${note}`
            };
          }
          return a;
        }));
        setItems(prev => prev.map(i => {
          if (i.id === apt.itemId) {
            return {
              ...i,
              qualityCheck: { passed: true, note, checkedBy: currentUser.id }
            };
          }
          return i;
        }));

        if (isSupabaseConfigured && supabase) {
          try {
            await Promise.all([
              supabase.from('appointments').update({
                status: 'ready_for_pickup',
                donor_arrived_at: now
              }).eq('id', aptId),
              supabase.from('items').update({
                quality_check: { passed: true, note, checkedBy: currentUser.id }
              }).eq('id', apt.itemId)
            ]);
          } catch (err) {
            console.error(err);
          }
        }
      } else {
        setAppointments(prev => prev.map(a => {
          if (a.id === aptId) {
            return {
              ...a,
              status: 'ready_for_pickup',
              donorArrivedAt: now,
              storageSlot: storageSlot,
              notes: `${a.notes} - Đã cất ô ${storageSlot}. Ghi chú: ${note}`
            };
          }
          return a;
        }));
        setItems(prev => prev.map(i => {
          if (i.id === apt.itemId) {
            return {
              ...i,
              status: 'stored',
              storageSlot: storageSlot,
              qualityCheck: { passed: true, note, checkedBy: currentUser.id }
            };
          }
          return i;
        }));

        if (isSupabaseConfigured && supabase) {
          try {
            await Promise.all([
              supabase.from('appointments').update({
                status: 'ready_for_pickup',
                donor_arrived_at: now,
                storage_slot: storageSlot
              }).eq('id', aptId),
              supabase.from('items').update({
                status: 'stored',
                storage_slot: storageSlot,
                quality_check: { passed: true, note, checkedBy: currentUser.id }
              }).eq('id', apt.itemId)
            ]);
          } catch (err) {
            console.error(err);
          }
        }
      }

      addLog('KIỂM TRA ĐẠT & LƯU TRẠM', `Kiểm tra đạt món ${apt.itemId} tại trạm. Đã lưu ô ${storageSlot || 'Bàn giao trực tiếp'}. Người kiểm tra: ${currentUser.name}.`);
      showNotification(`Món ${apt.itemId} ĐẠT kiểm tra! Sẵn sàng bàn giao cho người nhận.`, 'success');
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

      if (isSupabaseConfigured && supabase) {
        try {
          await Promise.all([
            supabase.from('appointments').update({ status: 'failed_inspection' }).eq('id', aptId),
            supabase.from('items').update({
              status: 'rejected',
              reject_reason: `Không đạt kiểm tra thực tế: ${note}`,
              quality_check: { passed: false, note, checkedBy: currentUser.id }
            }).eq('id', apt.itemId)
          ]);
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  // Tab E: Bàn giao đồ & Vô hiệu hóa mã nhận
  const completeHandover = async (enteredCode) => {
    const trimmedCode = enteredCode.trim().toUpperCase();
    const apt = appointments.find(a => a.pickupCode.toUpperCase() === trimmedCode);

    if (!apt) {
      return { success: false, message: 'Mã nhận đồ không tồn tại trong hệ thống!' };
    }

    if (apt.status === 'completed') {
      return { success: false, message: 'Mã nhận đồ này ĐÃ ĐƯỢC SỬ DỤNG trước đó và đã bị vô hiệu hóa!' };
    }

    if (apt.status === 'cancelled' || apt.status === 'failed_inspection') {
      return { success: false, message: 'Lịch hẹn này đã bị hủy hoặc đồ không đạt kiểm định!' };
    }

    const item = items.find(i => i.id === apt.itemId);
    if (!item?.qualityCheck?.passed) {
      return { success: false, message: 'Món đồ CHƯA QUA kiểm tra thực tế tại trạm, không thể bàn giao!' };
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

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

    if (isSupabaseConfigured && supabase) {
      try {
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
      } catch (err) {
        console.error(err);
      }
    }

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
        switchRole,
        resetToSeedData,
        uploadSeedToSupabase,
        isSupabaseConfigured,
        dbConnected,
        isSyncing,
        users: USERS,
        items,
        requests,
        appointments,
        logs,
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
