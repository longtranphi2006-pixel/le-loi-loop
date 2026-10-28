import React, { useState } from 'react';
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
  Award
} from 'lucide-react';

export default function Navbar({ activePage, setActivePage }) {
  const { currentUser, items, requests, appointments } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Tính số lượng badge
  const pendingItemsCount = items.filter(i => i.status === 'pending').length;
  const myAppointmentsCount = appointments.filter(a =>
    (a.donorId === currentUser.id || a.requesterId === currentUser.id) &&
    (a.status === 'scheduled' || a.status === 'ready_for_pickup')
  ).length;

  const navItems = [
    { id: 'home', label: 'Trang chủ', icon: Home },
    { id: 'catalog', label: 'Kho đồ', icon: Package, badge: items.filter(i => i.status === 'approved' && i.requestStatus === 'open').length },
    { id: 'donate', label: 'Đăng đồ', icon: PlusCircle },
    { id: 'my-activity', label: 'Hoạt động', icon: Clock, badge: myAppointmentsCount > 0 ? myAppointmentsCount : null },
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

          {/* User info quick peek on desktop */}
          <div className="hidden sm:flex items-center gap-3">
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
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-emerald-50 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
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

