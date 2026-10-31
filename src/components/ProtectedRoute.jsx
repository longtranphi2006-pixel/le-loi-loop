import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function ProtectedRoute({ allowedRoles, setActivePage, children }) {
  const { currentUser } = useApp();

  const isAllowed = allowedRoles.includes(currentUser?.role);

  if (!isAllowed) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white rounded-3xl p-8 border border-red-200 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Khu vực Giới hạn Quyền Truy cập</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Bạn đang đăng nhập với vai trò <strong>{currentUser?.name}</strong> ({currentUser?.role === 'student' ? 'Học sinh' : currentUser?.role}).
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

