import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  LogIn,
  User,
  Shield,
  KeyRound,
  AlertCircle,
  X,
  School,
  Lock,
  Info
} from 'lucide-react';

export const PILOT_ROLE_GUIDES = [
  {
    roleId: 'student_donor',
    roleLabel: 'Học sinh cho đồ',
    badge: 'Vai trò: HS Cho',
    description: 'Đăng tải đồ dùng học tập, xét chọn bạn nhận và mang đồ đến Phòng Đội theo lịch hẹn.'
  },
  {
    roleId: 'student_requester',
    roleLabel: 'Học sinh xin nhận',
    badge: 'Vai trò: HS Nhận',
    description: 'Xem kho đồ, gửi yêu cầu xin nhận đồ, nhận mã nhận đồ 4 số và đến Phòng Đội nhận đồ.'
  },
  {
    roleId: 'station_staff',
    roleLabel: 'Quản sinh Trạm Phòng Đội',
    badge: 'Vai trò: Quản sinh',
    description: 'Kiểm định chất lượng thực tế (Đạt/Không đạt), cất đồ vào 10 ô kệ và xác thực mã bàn giao.'
  },
  {
    roleId: 'teacher',
    roleLabel: 'Giáo viên phụ trách KHKT',
    badge: 'Vai trò: Giáo viên',
    description: 'Phê duyệt bài đăng đồ dùng, giám sát quy trình điều phối và bốc thăm công bằng.'
  }
];

export default function AuthModal({ isOpen, onClose }) {
  const { authUser, currentUser, setCurrentUser, showNotification } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSignIn = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    setLoading(true);

    try {
      if (!isSupabaseConfigured || !supabase) {
        setErrorMessage('Chưa cấu hình Supabase Cloud. Không thể thực hiện xác thực Supabase Auth.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage('Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại tài khoản được cấp phát.');
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMessage('Tài khoản chưa được xác thực email. Quản trị viên cần bật "Auto-confirm emails" trong Supabase Auth Settings.');
        } else {
          setErrorMessage(`Lỗi xác thực: ${error.message}`);
        }
        return;
      }

      if (data?.user) {
        showNotification(`Đăng nhập thành công với tài khoản ${data.user.email}!`, 'success');
        onClose();
      }
    } catch (err) {
      console.error('Auth login error:', err);
      setErrorMessage(err.message || 'Lỗi kết nối xác thực');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-200 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center ring-2 ring-white/20">
              <School className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg">Đăng Nhập Thí Điểm</h3>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-100 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                  KHKT THCS
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                LÊ LỢI LOOP • Trạm Phòng Đội Trường THCS Lê Lợi
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Role Guide Cards */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-600" />
              <span>4 vai trò trong buổi thử nghiệm đa thiết bị:</span>
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {PILOT_ROLE_GUIDES.map((g) => (
                <div
                  key={g.roleId}
                  className="p-2.5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{g.roleLabel}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-tight">{g.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Email tài khoản thử nghiệm</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Nhập email tài khoản được cấp phát..."
                  className="w-full text-xs px-3.5 py-2.5 pl-9 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Mật khẩu</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Nhập mật khẩu..."
                  className="w-full text-xs px-3.5 py-2.5 pl-9 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xác thực Supabase...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Đăng Nhập Supabase Auth</span>
                </>
              )}
            </button>
          </form>

          {/* Operational Guidance */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1 text-amber-950">
              <KeyRound className="w-3.5 h-3.5 text-amber-700" />
              <span>Quy tắc đăng nhập cho 3–5 thiết bị:</span>
            </div>
            <p>
              Mỗi thiết bị đăng nhập đúng tài khoản tương ứng với vai trò của người sử dụng. Không dùng chung một tài khoản trên nhiều máy để đảm bảo tính độc lập của chu trình trao nhận.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
