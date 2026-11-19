import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';

export default function ProtectedRoute({ allowedRoles, setActivePage, children }) {
  const { currentUser, openAuthModal } = useApp();

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white rounded-3xl p-8 border border-emerald-100 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto ring-4 ring-emerald-100">
          <LogIn className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Yêu cầu Đăng nhập</h2>
        <p className="text-xs text-gray-600 leading-relaxed">
          Vui lòng đăng nhập tài khoản học sinh hoặc giáo viên THCS Lê Lợi để tiếp tục sử dụng tính năng này.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={() => openAuthModal('login')}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>Đăng nhập ngay</span>
          </button>
          <button
            onClick={() => setActivePage('home')}
            className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về Trang chủ</span>
          </button>
        </div>
      </div>
    );
  }

  const isAllowed = allowedRoles.includes(currentUser.role);

  if (!isAllowed) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white rounded-3xl p-8 border border-red-200 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Khu vực Giới hạn Quyền Truy cập</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Bạn đang đăng nhập với vai trò <strong>{currentUser.name}</strong> ({currentUser.role === 'student' ? 'Học sinh' : currentUser.role === 'admin' ? 'Quản trị viên' : currentUser.role === 'teacher' ? 'Giáo viên' : 'Trực trạm'}).
          Khu vực Quản trị và Điều phối trạm chỉ dành cho Ban Giám hiệu, Giáo viên phụ trách KHKT và Đội tình nguyện trực trạm Phòng Đội.
        </p>
        <div className="pt-4">
          <button
            onClick={() => setActivePage('home')}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay về Trang chủ</span>
          </button>
        </div>
      </div>
    );
  }

  return children;
}

