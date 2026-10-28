import React from 'react';
import { useApp } from '../context/AppContext';
import { RefreshCw, ShieldAlert, Database, CloudCheck, CloudOff, ArrowUpCircle } from 'lucide-react';

export default function RoleSwitcher() {
  const {
    currentUser,
    switchRole,
    resetToSeedData,
    uploadSeedToSupabase,
    users,
    isSupabaseConfigured,
    dbConnected,
    isSyncing
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
            {isSupabaseConfigured && dbConnected ? (
              <span className="inline-flex items-center gap-1.5 bg-emerald-600/90 text-white px-2.5 py-0.5 rounded-full font-bold text-[11px] shadow-sm">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Supabase Real-time: Đã kết nối
              </span>
            ) : isSupabaseConfigured && !dbConnected ? (
              <span className="inline-flex items-center gap-1 bg-amber-500 text-amber-950 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                <Database className="w-3 h-3" />
                Supabase: Đang kết nối...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-amber-500/30 text-amber-100 border border-amber-400/40 px-2 py-0.5 rounded-full text-[10px]">
                <Database className="w-3 h-3 text-amber-300" />
                Chế độ Database: Local / Demo
              </span>
            )}

            {isSupabaseConfigured && (
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
            </div>
            <div className="text-[11px] text-gray-500 leading-none">
              {currentUser.role === 'teacher' ? 'Giáo viên phụ trách KHKT' : currentUser.role === 'station_staff' ? 'Đội trực trạm CLB' : `Học sinh lớp ${currentUser.class} (${currentUser.shift})`}
            </div>
          </div>
        </div>

        {/* Danh sách 4 vai trò nhanh */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-0.5">
          {users.map(u => {
            const isActive = currentUser.id === u.id;
            return (
              <button
                key={u.id}
                onClick={() => switchRole(u.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title={`${u.name} (${u.role})`}
              >
                <span className="font-bold text-[11px]">{u.id}</span>
                <span className="hidden sm:inline">{u.id === 'HS001' ? 'Bảo An (Sáng)' : u.id === 'HS002' ? 'Hoàng Nam (Chiều)' : u.id === 'TR01' ? 'Đội trực' : 'Thầy A'}</span>
              </button>
            );
          })}
        </div>

        {/* Nút reset demo data */}
        <button
          onClick={() => {
            if (window.confirm('Khôi phục toàn bộ dữ liệu mẫu (12 món đồ, 10 vị trí kệ, các lịch hẹn và nhật ký KHKT ban đầu)?')) {
              resetToSeedData();
            }
          }}
          disabled={isSyncing}
          className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all shadow-sm active:scale-95"
          title="Khôi phục trạng thái dữ liệu gốc ban đầu"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">Khôi phục demo</span>
        </button>
      </div>
    </>
  );
}
