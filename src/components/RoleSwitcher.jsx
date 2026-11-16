import React from 'react';
import { useApp } from '../context/AppContext';
import {
  RefreshCw,
  ShieldAlert,
  Database,
  CloudCheck,
  CloudOff,
  ArrowUpCircle,
  Lock,
  KeyRound,
  UserCheck,
  Target,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export default function RoleSwitcher() {
  const {
    currentUser,
    authUser,
    openAuthModal,
    switchRole,
    resetToSeedData,
    quickResetDemo,
    runDemoScenario,
    uploadSeedToSupabase,
    users,
    isSupabaseConfigured,
    dbConnected,
    isSyncing,
    syncStatus,
    syncError
  } = useApp();

  return (
    <>
      {/* 1. TOPBAR BANNER MÔ PHỎNG KHKT & TRẠNG THÁI CƠ SỞ DỮ LIỆU */}
      <div className="bg-gradient-to-r from-amber-700 via-emerald-800 to-teal-900 text-amber-50 text-xs py-1.5 px-4 font-medium flex items-center justify-between shadow-sm relative z-40">
        <div className="flex flex-col sm:flex-row items-center gap-2 max-w-7xl mx-auto w-full justify-between text-center sm:text-left">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-300 shrink-0 animate-pulse" />
            <span>
              <strong>DỰ ÁN KHKT THCS LÊ LỢI:</strong> Hệ thống điều phối ghép nối trao nhận đồ dùng học tập thông minh.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {syncStatus === 'synced' ? (
              <span className="inline-flex items-center gap-1.5 bg-emerald-600/90 text-white px-2.5 py-0.5 rounded-full font-bold text-[11px] shadow-sm">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Supabase Real-time: Đồng bộ Cloud
              </span>
            ) : syncStatus === 'syncing' ? (
              <span className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Đang đồng bộ Cloud...
              </span>
            ) : syncStatus === 'sync_error' ? (
              <span className="inline-flex items-center gap-1 bg-red-600 text-white px-2.5 py-0.5 rounded-full font-bold text-[11px]" title={syncError || 'Lỗi đồng bộ Cloud'}>
                <CloudOff className="w-3 h-3" />
                Lỗi đồng bộ Cloud
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-amber-500/30 text-amber-100 border border-amber-400/40 px-2 py-0.5 rounded-full text-[10px]">
                <Database className="w-3 h-3 text-amber-300" />
                Chế độ Database: Cục bộ / Offline
              </span>
            )}

            {isSupabaseConfigured ? (
              <span className="text-[10px] text-emerald-200/80 flex items-center gap-1 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                <Lock className="w-3 h-3 text-emerald-300" />
                <span>Pilot DB: Đã khóa nút ghi đè</span>
              </span>
            ) : (
              <button
                onClick={uploadSeedToSupabase}
                disabled={isSyncing}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1"
                title="Đẩy dữ liệu mẫu lên Supabase Database"
              >
                <ArrowUpCircle className="w-3 h-3 text-emerald-300" />
                <span>Nạp mẫu lên Supabase</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. FLOATING BAR CHUYỂN ĐỔI VAI TRÒ */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white/95 backdrop-blur-md border border-emerald-200 shadow-2xl rounded-full px-3 py-2 flex items-center gap-2 sm:gap-4 max-w-[95vw] transition-all">
        <div className="flex items-center gap-2 pr-2 border-r border-gray-200 shrink-0">
          <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-emerald-500 shrink-0">
            <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs font-bold text-gray-900 leading-tight flex items-center gap-1">
              {currentUser.name}
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                {currentUser.id}
              </span>
              {authUser && (
                <span className="text-[9px] bg-emerald-700 text-white px-1.5 py-0.2 rounded-full font-bold">
                  Auth ✓
                </span>
              )}
            </div>
            <div className="text-[11px] text-gray-500 leading-none">
              {currentUser.role === 'teacher' ? 'Giáo viên phụ trách KHKT' : currentUser.role === 'station_staff' ? 'Đội trực trạm CLB' : `Học sinh lớp ${currentUser.class} (${currentUser.shift})`}
            </div>
          </div>
        </div>

        {/* Danh sách 4 vai trò Demo Quick-Switch (Kích hoạt phiên Supabase Auth thật khi bấm) */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-0.5">
          {users.map(u => {
            const isActive = currentUser.id === u.id;
            return (
              <button
                key={u.id}
                id={`btn-switch-${u.id.toLowerCase()}`}
                onClick={() => switchRole(u.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title={`Đăng nhập phiên thật: ${u.name} (${u.role})`}
              >
                <span className="font-bold text-[11px]">{u.id}</span>
                <span className="hidden sm:inline">{u.id === 'HS001' ? 'Bảo An' : u.id === 'HS002' ? 'Hoàng Nam' : u.id === 'TR01' ? 'Đội trực' : 'Thầy A'}</span>
              </button>
            );
          })}
          <button
            id="btn-roleswitcher-account"
            onClick={() => openAuthModal('login')}
            className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 ml-1"
            title="Đăng nhập tài khoản khác"
          >
            <KeyRound className="w-3 h-3 text-emerald-600" />
            <span className="hidden sm:inline">Tài khoản</span>
          </button>
        </div>

        {/* CÁC NÚT ĐIỀU KHIỂN TRÌNH DIỄN KHKT */}
        <div className="flex items-center gap-1.5 shrink-0 pl-1 border-l border-gray-200">
          {/* Nút 1: Chạy Kịch bản mẫu KHKT */}
          <button
            onClick={runDemoScenario}
            className="flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-md shadow-emerald-700/20 active:scale-95 shrink-0"
            title="Tự động tạo tình huống lệch ca kinh điển để thuyết trình trước Hội đồng KHKT"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span className="hidden sm:inline">Kịch bản KHKT</span>
            <span className="sm:hidden text-[11px]">KHKT</span>
          </button>

          {/* Nút 2: Reset Demo 3 Giây */}
          <button
            onClick={() => {
              if (window.confirm('Khôi phục toàn bộ dữ liệu mẫu chuẩn trong 3 giây?')) {
                quickResetDemo();
              }
            }}
            disabled={isSyncing}
            className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all shadow-sm active:scale-95"
            title="Khôi phục trạng thái dữ liệu sạch đẹp ngay lập tức nếu thao tác nhầm"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-amber-700 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Reset 3s</span>
          </button>
        </div>
      </div>
    </>
  );
}
