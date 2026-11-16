import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  LogIn,
  UserPlus,
  User,
  Shield,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  X,
  School,
  Lock,
  Eye,
  EyeOff,
  Sun,
  Sunset,
  Clock,
  Sparkles,
  Phone,
  GraduationCap,
  Users
} from 'lucide-react';

const MIDDLE_SCHOOL_CLASSES = [
  '6/1', '6/2', '6/3', '6/4',
  '7/1', '7/2', '7/3', '7/4',
  '8/1', '8/2', '8/3', '8/4',
  '9/1', '9/2', '9/3', '9/4'
];

export default function AuthModal({ isOpen, onClose }) {
  const {
    authUser,
    currentUser,
    authModalMode,
    setAuthModalMode,
    signInWithStudentCodeOrEmail,
    signUpStudentOrStaff,
    checkStudentCodeAvailable,
    showNotification
  } = useApp();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  
  // Login fields
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register fields
  const [role, setRole] = useState('student'); // 'student' | 'teacher' | 'station_staff'
  const [schoolCode, setSchoolCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [className, setClassName] = useState('7/1');
  const [studyShift, setStudyShift] = useState('Sáng');
  const [phone, setPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [codeCheckStatus, setCodeCheckStatus] = useState(null); // { available: bool, message: string }

  // Sync mode with AppContext when modal opens
  useEffect(() => {
    if (authModalMode) {
      setMode(authModalMode);
    }
  }, [authModalMode, isOpen]);

  // Debounced check student code availability
  useEffect(() => {
    if (mode !== 'register' || !studentCode.trim() || studentCode.trim().length < 3) {
      setCodeCheckStatus(null);
      return;
    }

    const timer = setTimeout(async () => {
      const res = await checkStudentCodeAvailable(studentCode);
      setCodeCheckStatus(res);
    }, 400);

    return () => clearTimeout(timer);
  }, [studentCode, mode]);

  if (!isOpen) return null;

  // Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const res = await signInWithStudentCodeOrEmail({
        loginIdentifier: loginId,
        password: loginPassword
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Đăng nhập không thành công.');
      } else {
        setSuccessMessage('Đăng nhập thành công! Đang chuyển hướng...');
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Lỗi kết nối xác thực.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (fullName.trim().length < 3) {
      setErrorMessage('Họ và tên học sinh phải có ít nhất 3 ký tự.');
      return;
    }

    if (studentCode.trim().length < 3) {
      setErrorMessage('Mã học sinh / Tên đăng nhập phải có ít nhất 3 ký tự.');
      return;
    }

    if (role !== 'student' && schoolCode.trim() !== 'LELOI2026') {
      setErrorMessage('Mã xác thực nội bộ trường không chính xác (Yêu cầu: LELOI2026).');
      return;
    }

    if (registerPassword.length < 6) {
      setErrorMessage('Mật khẩu phải có tối thiểu 6 ký tự.');
      return;
    }

    if (registerPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.');
      return;
    }

    if (codeCheckStatus && !codeCheckStatus.available) {
      setErrorMessage(codeCheckStatus.message || 'Mã học sinh đã tồn tại.');
      return;
    }

    setLoading(true);

    try {
      const res = await signUpStudentOrStaff({
        studentCode: studentCode.trim(),
        fullName: fullName.trim(),
        className: role === 'teacher' ? 'Hội đồng KHKT' : role === 'station_staff' ? 'Đội Tình Nguyện' : className,
        studyShift,
        role,
        schoolCode: schoolCode.trim(),
        password: registerPassword,
        phone: phone.trim()
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Đăng ký không thành công.');
      } else {
        setSuccessMessage(`Đăng ký thành công tài khoản [${studentCode.toUpperCase()}]! Đang đăng nhập...`);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Lỗi hệ thống khi đăng ký.');
    } finally {
      setLoading(false);
    }
  };

  // Helper điền nhanh tài khoản demo
  const fillDemoAccount = (id, pwd = 'LeLoi@2026') => {
    setLoginId(id);
    setLoginPassword(pwd);
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden relative max-h-[92vh] flex flex-col">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 text-white p-5 sm:p-6 relative shrink-0">
          <button
            id="btn-modal-close"
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-200 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center ring-2 ring-white/20 shadow-md">
              <School className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg">Hệ Thống Tài Khoản</h3>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-100 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                  THCS Lê Lợi
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                LÊ LỢI LOOP • Nền tảng điều phối trao nhận đồ dùng học tập
              </p>
            </div>
          </div>

          {/* TAB SWITCHER */}
          <div className="grid grid-cols-2 bg-emerald-950/60 p-1 rounded-2xl mt-4 border border-emerald-700/40">
            <button
              id="tab-btn-login"
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-white text-emerald-950 shadow-md'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng Nhập</span>
            </button>
            <button
              id="tab-btn-register"
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-white text-emerald-950 shadow-md'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Đăng Ký Học Sinh</span>
            </button>
          </div>
        </div>

        {/* CONTENT BODY (SCROLLABLE) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Thông báo lỗi / thành công */}
          {errorMessage && (
            <div id="auth-error-alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div id="auth-success-alert" className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span className="leading-snug font-medium">{successMessage}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: FORM ĐĂNG NHẬP */}
          {/* ========================================================================= */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Mã học sinh / Tên đăng nhập (hoặc Email)
                </label>
                <div className="relative">
                  <input
                    id="login-identifier"
                    type="text"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    required
                    placeholder="VD: HS001, hs009 hoặc an.tb71..."
                    className="w-full text-xs px-3.5 py-2.5 pl-9 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  * Hệ thống tự động nhận diện tài khoản trường <code className="text-emerald-700 font-semibold">@leloiloop.edu.vn</code>
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder="Nhập mật khẩu..."
                    className="w-full text-xs px-3.5 py-2.5 pl-9 pr-9 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="btn-login-submit"
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang đăng nhập Supabase...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Đăng Nhập Hệ Thống</span>
                  </>
                )}
              </button>

              {/* DEMO QUICK PICK CHIPS */}
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                  <span>Tài khoản mẫu báo cáo KHKT:</span>
                  <span className="text-emerald-700 font-semibold">(Mật khẩu: LeLoi@2026)</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('HS001')}
                    className="p-2 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 text-left text-emerald-950 transition-colors"
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>HS001 (Bảo An)</span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1 rounded">7/1</span>
                    </div>
                    <div className="text-[10px] text-gray-500">Học sinh cho đồ (Sáng)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillDemoAccount('HS002')}
                    className="p-2 rounded-xl border border-teal-200 bg-teal-50/50 hover:bg-teal-100/70 text-left text-teal-950 transition-colors"
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>HS002 (Hoàng Nam)</span>
                      <span className="text-[10px] bg-teal-200 text-teal-800 px-1 rounded">8/2</span>
                    </div>
                    <div className="text-[10px] text-gray-500">Học sinh nhận đồ (Chiều)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillDemoAccount('TR01')}
                    className="p-2 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 text-left text-amber-950 transition-colors"
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>TR01 (Đội trực)</span>
                      <span className="text-[10px] bg-amber-200 text-amber-800 px-1 rounded">CLB</span>
                    </div>
                    <div className="text-[10px] text-gray-500">Trực trạm Phòng Đội</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillDemoAccount('GV01')}
                    className="p-2 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 text-left text-purple-950 transition-colors"
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>GV01 (Thầy A)</span>
                      <span className="text-[10px] bg-purple-200 text-purple-800 px-1 rounded">GV</span>
                    </div>
                    <div className="text-[10px] text-gray-500">Giáo viên phụ trách</div>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: FORM ĐĂNG KÝ HỌC SINH / GIÁO VIÊN */}
          {/* ========================================================================= */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Chọn vai trò */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                  Vai trò đăng ký
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  <button
                    id="role-btn-student"
                    type="button"
                    onClick={() => setRole('student')}
                    className={`p-2 rounded-xl border font-bold text-center transition-all flex flex-col items-center gap-1 ${
                      role === 'student'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-400'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    <span>Học sinh</span>
                  </button>

                  <button
                    id="role-btn-teacher"
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`p-2 rounded-xl border font-bold text-center transition-all flex flex-col items-center gap-1 ${
                      role === 'teacher'
                        ? 'border-purple-600 bg-purple-50 text-purple-950 ring-2 ring-purple-400'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <School className="w-4 h-4 text-purple-600" />
                    <span>Giáo viên</span>
                  </button>

                  <button
                    id="role-btn-station"
                    type="button"
                    onClick={() => setRole('station_staff')}
                    className={`p-2 rounded-xl border font-bold text-center transition-all flex flex-col items-center gap-1 ${
                      role === 'station_staff'
                        ? 'border-amber-600 bg-amber-50 text-amber-950 ring-2 ring-amber-400'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Users className="w-4 h-4 text-amber-600" />
                    <span>Trực trạm</span>
                  </button>
                </div>
              </div>

              {/* Mã xác thực trường (Nếu là Giáo viên / Trực trạm) */}
              {role !== 'student' && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1.5 animate-fadeIn">
                  <label className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-purple-700" />
                    <span>Mã xác thực nội bộ trường (Bảo vệ RBAC):</span>
                  </label>
                  <input
                    id="auth-school-code"
                    type="password"
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value)}
                    required
                    placeholder="Nhập mã xác thực do nhà trường cấp (LELOI2026)..."
                    className="w-full text-xs px-3 py-2 rounded-lg border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                  <p className="text-[10px] text-purple-800">
                    * Yêu cầu nhập mã để ngăn học sinh tự ý đăng ký tài khoản quyền quản trị.
                  </p>
                </div>
              )}

              {/* Họ và tên */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Họ và tên đầy đủ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="register-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="VD: Nguyễn Minh Khôi, Trần Bảo An..."
                    className="w-full text-xs px-3.5 py-2.5 pl-9 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Mã học sinh & Lớp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Mã HS / Tên đăng nhập <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="register-student-code"
                    type="text"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value.replace(/[^a-zA-Z0-9._-]/g, '').toUpperCase())}
                    required
                    placeholder="VD: HS009, KHOI.NM..."
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold uppercase"
                  />
                  {codeCheckStatus && (
                    <div className={`text-[11px] mt-1 font-semibold flex items-center gap-1 ${
                      codeCheckStatus.available ? 'text-emerald-700' : 'text-red-600'
                    }`}>
                      {codeCheckStatus.available ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      <span>{codeCheckStatus.message}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    {role === 'student' ? 'Lớp học' : 'Đơn vị / Ban'}
                  </label>
                  {role === 'student' ? (
                    <select
                      id="register-class"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                    >
                      {MIDDLE_SCHOOL_CLASSES.map(cls => (
                        <option key={cls} value={cls}>Lớp {cls}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      placeholder={role === 'teacher' ? 'Hội đồng KHKT' : 'Đội Tình Nguyện'}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50"
                    />
                  )}
                </div>
              </div>

              {/* Buổi học chính (Học Sáng -> rảnh Chiều, Học Chiều -> rảnh Sáng) */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Buổi học chính tại trường <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setStudyShift('Sáng')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      studyShift === 'Sáng'
                        ? 'border-amber-500 bg-amber-50/80 text-amber-950 ring-2 ring-amber-400'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Sun className="w-4 h-4 text-amber-600" />
                      <span>Học buổi Sáng</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      Rảnh chiều • Thuật toán gợi ý ca Chiều
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStudyShift('Chiều')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      studyShift === 'Chiều'
                        ? 'border-blue-500 bg-blue-50/80 text-blue-950 ring-2 ring-blue-400'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Sunset className="w-4 h-4 text-blue-600" />
                      <span>Học buổi Chiều</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      Rảnh sáng • Thuật toán gợi ý ca Sáng
                    </div>
                  </button>
                </div>
              </div>

              {/* Mật khẩu & Xác nhận mật khẩu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Mật khẩu (Tối thiểu 6 ký tự) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="register-password"
                      type={showRegisterPassword ? 'text' : 'password'}
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                      placeholder="Nhập mật khẩu..."
                      className="w-full text-xs px-3.5 py-2.5 pl-8 pr-8 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-2.5 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showRegisterPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Xác nhận mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="register-confirm-password"
                      type={showRegisterPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Nhập lại mật khẩu..."
                      className="w-full text-xs px-3.5 py-2.5 pl-8 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
                  </div>
                </div>
              </div>

              {/* SĐT phụ huynh / Ghi chú liên hệ */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  SĐT liên hệ phụ huynh (Tùy chọn)
                </label>
                <div className="relative">
                  <input
                    id="register-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="VD: 0905.xxx.xxx (để nhận tin nhắn khi có sách)"
                    className="w-full text-xs px-3.5 py-2.5 pl-9 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="btn-register-submit"
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang khởi tạo tài khoản Supabase...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Tạo Tài Khoản & Bắt Đầu Sử Dụng</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
