import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Home,
  Package,
  PlusCircle,
  Clock,
  Warehouse,
  Cpu,
  SlidersHorizontal,
  Menu,
  X,
  Bell,
  CheckCheck,
  ArrowRight,
  LogIn,
  LogOut,
  UserPlus,
  User,
  Shield,
  ChevronDown
} from 'lucide-react';

export default function Navbar({ activePage, setActivePage }) {
  const {
    currentUser,
    authUser,
    openAuthModal,
    signOut,
    items,
    requests,
    appointments,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  // Lọc thông báo gửi đến người dùng hiện tại (nếu đã đăng nhập)
  const myNotifications = currentUser
    ? (notifications || []).filter(n => n.recipientId === currentUser.id)
    : [];
  const unreadCount = myNotifications.filter(n => !n.isRead).length;

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tính số lượng badge
  const pendingItemsCount = items.filter(i => i.status === 'pending').length;
  const myAppointmentsCount = currentUser
    ? appointments.filter(a =>
        (a.donorId === currentUser.id || a.requesterId === currentUser.id) &&
        (a.status === 'scheduled' || a.status === 'ready_for_pickup')
      ).length
    : 0;

  const myPostedItemIds = currentUser
    ? items.filter(i => i.donorId === currentUser.id).map(i => i.id)
    : [];
  const incomingPendingCount = currentUser
    ? requests.filter(r => myPostedItemIds.includes(r.itemId) && r.status === 'pending').length
    : 0;
  const totalActivityBadge = myAppointmentsCount + incomingPendingCount;

  // Xây dựng danh mục điều hướng theo phiên đăng nhập thực tế (Auth-Driven Navigation)
  const navItems = [];
  
  // 1. Các tab công khai (Mọi người dùng và Khách vãng lai đều xem được)
  navItems.push({ id: 'home', label: 'Trang chủ', icon: Home });
  navItems.push({
    id: 'catalog',
    label: 'Kho đồ',
    icon: Package,
    badge: items.filter(i => i.status === 'approved' && i.requestStatus === 'open').length || null
  });

  // 2. Các tab yêu cầu danh tính (Chỉ hiển thị khi đã đăng nhập)
  if (currentUser) {
    navItems.push({ id: 'donate', label: 'Đăng đồ', icon: PlusCircle });
    navItems.push({
      id: 'my-activity',
      label: 'Hoạt động',
      icon: Clock,
      badge: totalActivityBadge > 0 ? totalActivityBadge : null
    });
  }

  // 3. Tab Thông tin Trạm và Thuật toán (Công khai)
  navItems.push({ id: 'station', label: 'Trạm Lê Lợi', icon: Warehouse });
  navItems.push({ id: 'loopmatch', label: 'LoopMatch', icon: Cpu });

  // 4. Tab Quản lý nghiệp vụ (Chỉ dành cho Giáo viên, Đội trực trạm hoặc Admin - Học sinh tuyệt đối không thấy)
  if (currentUser && (currentUser.role === 'teacher' || currentUser.role === 'station_staff' || currentUser.role === 'admin')) {
    navItems.push({
      id: 'admin',
      label: 'Quản lý',
      icon: SlidersHorizontal,
      badge: pendingItemsCount > 0 ? pendingItemsCount : null
    });
  }

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & School Branding */}
          <div
            onClick={() => setActivePage('home')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white shadow-md shadow-emerald-200 group-hover:scale-105 transition-transform">
              <span className="font-extrabold text-base tracking-tighter">3L</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight text-emerald-950 uppercase">
                  Lê Lợi <span className="text-emerald-600">Loop</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                  THCS Lê Lợi
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium hidden sm:block">
                Đồ cũ trao tay – Giá trị ở lại
              </p>
            </div>
          </div>

          {/* Desktop Navigation links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-50/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <span>{item.label}</span>
                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive
                          ? 'bg-white text-emerald-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right actions: Auth-Driven User Area */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* THÔNG BÁO CHỈ HIỂN THỊ KHI ĐÃ ĐĂNG NHẬP */}
            {currentUser && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className={`relative p-2 rounded-xl transition-all ${
                    notifDropdownOpen
                      ? 'bg-emerald-100 text-emerald-900 ring-2 ring-emerald-500'
                      : 'text-gray-600 hover:text-emerald-800 hover:bg-emerald-50'
                  }`}
                  title="Thông báo của bạn"
                >
                  <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-emerald-700 animate-wiggle' : ''}`} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* NOTIFICATIONS DROPDOWN MENU */}
                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-fadeIn">
                    <div className="p-4 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-emerald-300" />
                        <h4 className="font-bold text-xs sm:text-sm">Thông báo của bạn</h4>
                        {unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-[10px] px-2 py-0.2 rounded-full font-bold">
                            {unreadCount} mới
                          </span>
                        )}
                      </div>

                      {unreadCount > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-[11px] text-emerald-200 hover:text-white flex items-center gap-1 font-semibold"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Đọc hết</span>
                        </button>
                      )}
                    </div>

                    <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 p-1">
                      {myNotifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-gray-500 space-y-1">
                          <Bell className="w-8 h-8 text-gray-300 mx-auto" />
                          <p className="font-medium">Chưa có thông báo nào dành cho bạn.</p>
                        </div>
                      ) : (
                        myNotifications.map(notif => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              markNotificationAsRead(notif.id);
                              setNotifDropdownOpen(false);
                              setActivePage('my-activity');
                            }}
                            className={`p-3.5 rounded-2xl cursor-pointer transition-colors space-y-1.5 ${
                              notif.isRead
                                ? 'bg-white hover:bg-gray-50'
                                : 'bg-emerald-50/70 hover:bg-emerald-100/70 border-l-4 border-emerald-600'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                                {!notif.isRead && <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />}
                                {notif.title}
                              </span>
                              <span className="text-[10px] text-gray-400 shrink-0">{notif.createdAt}</span>
                            </div>

                            <p className="text-xs text-gray-600 leading-snug">
                              {notif.message}
                            </p>

                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] text-emerald-800 font-bold flex items-center gap-1 hover:underline">
                                <span>Xem chi tiết & Phản hồi</span>
                                <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PHẦN TÀI KHOẢN (AUTH-DRIVEN HEADER) */}
            {currentUser ? (
              <div className="relative" ref={userRef}>
                <button
                  id="header-user-display"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl border border-emerald-200 hover:border-emerald-400 bg-emerald-50/50 hover:bg-emerald-100/60 transition-all text-left group"
                >
                  <img
                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full ring-2 ring-emerald-500 object-cover"
                  />
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5 leading-tight">
                      <span className="truncate max-w-[130px]">{currentUser.name}</span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 font-black px-1.5 py-0.2 rounded">
                        {currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'teacher' ? 'GV' : currentUser.role === 'station_staff' ? 'Trực trạm' : currentUser.class ? `${currentUser.class}` : 'HS'}
                      </span>
                    </div>
                    <div className="text-[10px] text-emerald-700 font-medium">
                      {currentUser.role === 'admin'
                        ? 'Quản trị viên Hệ thống'
                        : currentUser.role === 'teacher'
                        ? 'Giáo viên phụ trách'
                        : currentUser.role === 'station_staff'
                        ? 'Đội tình nguyện Phòng Đội'
                        : `Buổi ${currentUser.shift || 'Sáng'}`}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-700 transition-transform" />
                </button>

                {/* DROPDOWN MENU TÀI KHOẢN */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fadeIn p-2 text-xs">
                    {/* User Profile Summary */}
                    <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100/70 mb-2">
                      <div className="font-extrabold text-sm text-gray-900">{currentUser.name}</div>
                      <div className="text-gray-500 text-[11px] mt-0.5">
                        Mã: <strong className="font-mono text-emerald-800">{currentUser.id}</strong>
                        {currentUser.class && ` • Lớp ${currentUser.class}`}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-bold mt-1">
                        Vai trò: {currentUser.role === 'admin' ? 'Quản trị viên cấp cao (Admin)' : currentUser.role === 'teacher' ? 'Giáo viên quản trị' : currentUser.role === 'station_staff' ? 'Cán bộ trực trạm' : 'Học sinh'}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setActivePage('my-activity');
                        }}
                        className="w-full flex items-center gap-2 p-2.5 rounded-xl text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 font-semibold transition-colors"
                      >
                        <Clock className="w-4 h-4 text-emerald-600" />
                        <span>Hoạt động của tôi</span>
                      </button>

                      {currentUser.role !== 'student' && (
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            setActivePage('admin');
                          }}
                          className="w-full flex items-center gap-2 p-2.5 rounded-xl text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 font-semibold transition-colors"
                        >
                          <Shield className="w-4 h-4 text-emerald-600" />
                          <span>Bảng điều khiển quản lý</span>
                        </button>
                      )}

                      <div className="border-t border-gray-100 my-1" />

                      <button
                        id="btn-logout"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          signOut();
                        }}
                        className="w-full flex items-center gap-2 p-2.5 rounded-xl text-red-600 hover:bg-red-50 font-bold transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Đăng xuất tài khoản</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* KHI CHƯA ĐĂNG NHẬP (KHÁCH): 2 NÚT NỔI BẬT */
              <div className="flex items-center gap-2">
                <button
                  id="btn-nav-login"
                  onClick={() => openAuthModal('login')}
                  className="flex items-center gap-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border-2 border-emerald-300 hover:border-emerald-500 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                  title="Đăng nhập tài khoản trường"
                >
                  <LogIn className="w-4 h-4 text-emerald-600" />
                  <span>Đăng nhập</span>
                </button>
                <button
                  id="btn-nav-register"
                  onClick={() => openAuthModal('register')}
                  className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-700/20"
                  title="Đăng ký tài khoản học sinh mới"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Đăng ký</span>
                </button>
              </div>
            )}

            {/* Mobile hamburger */}
            <div className="flex lg:hidden items-center ml-1">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:bg-emerald-50 focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-emerald-100 bg-white px-4 pt-2 pb-4 space-y-2 shadow-lg animate-fadeIn">
          {currentUser ? (
            <div className="p-3 bg-emerald-50 rounded-2xl flex items-center justify-between border border-emerald-100 mb-2">
              <div className="flex items-center gap-2.5">
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-full ring-2 ring-emerald-500 object-cover"
                />
                <div>
                  <div className="text-xs font-bold text-gray-900 flex items-center gap-1">
                    <span>{currentUser.name}</span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1 rounded font-bold">
                      {currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'teacher' ? 'GV' : currentUser.role === 'station_staff' ? 'Trực trạm' : currentUser.class || 'HS'}
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold">
                    {currentUser.role === 'admin'
                      ? 'Quản trị viên Hệ thống'
                      : currentUser.role === 'teacher'
                      ? 'Giáo viên phụ trách'
                      : currentUser.role === 'station_staff'
                      ? 'Đội trực trạm'
                      : `Lớp ${currentUser.class} • Buổi ${currentUser.shift}`}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  signOut();
                  setMobileMenuOpen(false);
                }}
                className="text-xs text-red-600 font-bold bg-white px-2.5 py-1.5 rounded-xl border border-red-200 hover:bg-red-50 flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Thoát</span>
              </button>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50/70 rounded-2xl flex items-center justify-between border border-emerald-100 mb-2">
              <div className="text-xs font-medium text-gray-600">
                Chào mừng bạn đến với Lê Lợi Loop!
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    openAuthModal('login');
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs bg-white text-emerald-800 border border-emerald-300 font-bold px-2.5 py-1.5 rounded-lg shadow-sm"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => {
                    openAuthModal('register');
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs bg-emerald-700 text-white font-bold px-2.5 py-1.5 rounded-lg shadow-sm"
                >
                  Đăng ký
                </button>
              </div>
            </div>
          )}

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium ${
                  isActive
                    ? 'bg-emerald-700 text-white font-semibold'
                    : 'text-gray-700 hover:bg-emerald-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isActive ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
