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
  FlaskConical,
  Menu,
  X,
  Sparkles,
  Award,
  Bell,
  CheckCheck,
  CheckCircle2,
  Heart,
  MessageSquare,
  ArrowRight
} from 'lucide-react';

export default function Navbar({ activePage, setActivePage }) {
  const {
    currentUser,
    items,
    requests,
    appointments,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const notifRef = useRef(null);

  // Lọc thông báo gửi đến người dùng hiện tại
  const myNotifications = (notifications || []).filter(n => n.recipientId === currentUser.id);
  const unreadCount = myNotifications.filter(n => !n.isRead).length;

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tính số lượng badge
  const pendingItemsCount = items.filter(i => i.status === 'pending').length;
  const myAppointmentsCount = appointments.filter(a =>
    (a.donorId === currentUser.id || a.requesterId === currentUser.id) &&
    (a.status === 'scheduled' || a.status === 'ready_for_pickup')
  ).length;

  const myPostedItemIds = items.filter(i => i.donorId === currentUser.id).map(i => i.id);
  const incomingPendingCount = requests.filter(r => myPostedItemIds.includes(r.itemId) && r.status === 'pending').length;
  const totalActivityBadge = myAppointmentsCount + incomingPendingCount;

  const navItems = [
    { id: 'home', label: 'Trang chủ', icon: Home },
    { id: 'catalog', label: 'Kho đồ', icon: Package, badge: items.filter(i => i.status === 'approved' && i.requestStatus === 'open').length },
    { id: 'donate', label: 'Đăng đồ', icon: PlusCircle },
    { id: 'my-activity', label: 'Hoạt động', icon: Clock, badge: totalActivityBadge > 0 ? totalActivityBadge : null },
    { id: 'station', label: 'Trạm Lê Lợi', icon: Warehouse },
    { id: 'loopmatch', label: 'LoopMatch', icon: Cpu },
    { id: 'admin', label: 'Quản lý', icon: SlidersHorizontal, badge: (currentUser.role === 'teacher' || currentUser.role === 'station_staff') && pendingItemsCount > 0 ? pendingItemsCount : null },
    { id: 'lab', label: 'Phòng thí nghiệm', icon: FlaskConical },
  ];

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
                  KHKT THCS
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

          {/* Right actions: Notification Bell & User profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* 🔔 NOTIFICATION BELL DROPDOWN */}
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

              {/* DROPDOWN MENU */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-fadeIn">
                  {/* Header */}
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

                  {/* Notification List */}
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

            {/* User profile */}
            <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-gray-200">
              <div className="text-right">
                <div className="text-xs font-bold text-gray-900">{currentUser.name}</div>
                <div className="text-[11px] text-emerald-700 font-medium">
                  {currentUser.role === 'teacher' ? 'GV Phụ trách' : currentUser.role === 'station_staff' ? 'Đội Trực Trạm' : `HS Lớp ${currentUser.class}`}
                </div>
              </div>
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-9 h-9 rounded-full ring-2 ring-emerald-500 object-cover"
              />
            </div>

            {/* Mobile hamburger */}
            <div className="flex lg:hidden items-center">
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
        <div className="lg:hidden border-t border-emerald-100 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
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
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
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
