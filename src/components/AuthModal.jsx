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

  // Chuyển đổi vai trò và đồng bộ các trường tương ứng phù hợp thực tế trường học
  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setErrorMessage('');
    if (newRole === 'student') {
      setClassName('7/1');
      setStudyShift('Sáng');
    } else if (newRole === 'teacher') {
      setClassName('Tổ KHTN & Hội đồng KHKT');
      setStudyShift('Toàn thời gian');
    } else if (newRole === 'station_staff') {
      setClassName('CLB Tình Nguyện Lê Lợi');
      setStudyShift('Cả ngày');
    }
  };

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
      setErrorMessage(
        role === 'teacher'
          ? 'Họ và tên giáo viên phải có ít nhất 3 ký tự.'
          : role === 'station_staff'
          ? 'Họ tên cán bộ / Tên đội trực phải có ít nhất 3 ký tự.'
          : 'Họ và tên học sinh phải có ít nhất 3 ký tự.'
      );
      return;
    }

    if (studentCode.trim().length < 3) {
      setErrorMessage(
        role === 'teacher'
          ? 'Mã giáo viên / Tên đăng nhập phải có ít nhất 3 ký tự.'
          : role === 'station_staff'
          ? 'Mã trực trạm / Tên đăng nhập phải có ít nhất 3 ký tự.'
          : 'Mã học sinh / Tên đăng nhập phải có ít nhất 3 ký tự.'
      );
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
      setErrorMessage(codeCheckStatus.message || 'Mã đăng nhập đã tồn tại. Vui lòng chọn mã khác.');
      return;
    }

    setLoading(true);

    try {
      const res = await signUpStudentOrStaff({
        studentCode: studentCode.trim(),
        fullName: fullName.trim(),
        className: className.trim() || (role === 'teacher' ? 'Hội đồng KHKT' : role === 'station_staff' ? 'Đội Tình Nguyện' : '7/1'),
        studyShift: studyShift || (role === 'teacher' ? 'Toàn thời gian' : role === 'station_staff' ? 'Cả ngày' : 'Sáng'),
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
                    onClick={() => handleRoleChange('student')}
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
                    onClick={() => handleRoleChange('teacher')}
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
                    onClick={() => handleRoleChange('station_staff')}
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
                  {role === 'teacher'
                    ? 'Họ và tên giáo viên'
                    : role === 'station_staff'
                    ? 'Họ tên cán bộ / Tên đội trực'
                    : 'Họ và tên học sinh'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="register-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder={
                      role === 'teacher'
                        ? 'VD: Thầy Nguyễn Văn A, Cô Lê Thị B...'
                        : role === 'station_staff'
                        ? 'VD: Đội Tình Nguyện THCS Lê Lợi, Nguyễn Văn C...'
                        : 'VD: Nguyễn Minh Khôi, Trần Bảo An...'
                    }
                    className="w-full text-xs px-3.5 py-2.5 pl-9 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Mã học sinh & Lớp / Đơn vị */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    {role === 'teacher'
                      ? 'Mã GV / Tên đăng nhập'
                      : role === 'station_staff'
                      ? 'Mã trực trạm / Tên đăng nhập'
                      : 'Mã HS / Tên đăng nhập'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="register-student-code"
                    type="text"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value.replace(/[^a-zA-Z0-9._-]/g, '').toUpperCase())}
                    required
                    placeholder={
                      role === 'teacher'
                        ? 'VD: GV01, THAY.AN...'
                        : role === 'station_staff'
                        ? 'VD: TR01, TRUCTRAM...'
                        : 'VD: HS009, KHOI.NM...'
                    }
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
                    {role === 'teacher'
                      ? 'Tổ chuyên môn / Bộ phận'
                      : role === 'station_staff'
                      ? 'Đội / Ban trực phụ trách'
                      : 'Lớp học'}{' '}
                    <span className="text-red-500">*</span>
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
                      required
                      placeholder={
                        role === 'teacher'
                          ? 'VD: Tổ KHTN, Tổ Toán - Tin, Hội đồng KHKT...'
                          : 'VD: CLB Tình Nguyện, Phòng Đoàn Đội...'
                      }
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  )}
                </div>
              </div>

              {/* Buổi học chính / Ca trực công tác */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  {role === 'teacher'
                    ? 'Thời gian làm việc / Trực trường'
                    : role === 'station_staff'
                    ? 'Khung giờ trực phụ trách tại Trạm K1'
                    : 'Buổi học chính tại trường'}{' '}
                  <span className="text-red-500">*</span>
                </label>

                {role === 'student' ? (
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
                        Rảnh chiều • Xếp ca nhận đồ buổi Chiều
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
                        Rảnh sáng • Xếp ca nhận đồ buổi Sáng
                      </div>
                    </button>
                  </div>
                ) : role === 'teacher' ? (
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    {[
                      { id: 'Toàn thời gian', label: 'Toàn thời gian', desc: 'Cả ngày tại trường' },
                      { id: 'Sáng', label: 'Buổi Sáng', desc: '07:00 - 11:30' },
                      { id: 'Chiều', label: 'Buổi Chiều', desc: '13:00 - 17:30' }
                    ].map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setStudyShift(s.id)}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          studyShift === s.id
                            ? 'border-purple-600 bg-purple-50 text-purple-950 ring-2 ring-purple-400 font-bold'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-semibold text-xs">{s.label}</div>
                        <div className="text-[10px] text-gray-500">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    {[
                      { id: 'Cả ngày', label: 'Theo ca phân công', desc: 'Cả ngày' },
                      { id: 'Sáng', label: 'Ca Sáng', desc: '09:15 - 10:00' },
                      { id: 'Chiều', label: 'Ca Chiều', desc: '14:00 - 14:45' }
                    ].map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setStudyShift(s.id)}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          studyShift === s.id
                            ? 'border-amber-600 bg-amber-50 text-amber-950 ring-2 ring-amber-400 font-bold'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-semibold text-xs">{s.label}</div>
                        <div className="text-[10px] text-gray-500">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                )}
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

              {/* Số điện thoại liên hệ */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  {role === 'teacher'
                    ? 'Số điện thoại / Zalo công tác (Tùy chọn)'
                    : role === 'station_staff'
                    ? 'Số điện thoại trực trạm / Zalo Đội (Tùy chọn)'
                    : 'Số điện thoại phụ huynh (Tùy chọn)'}
                </label>
                <div className="relative">
                  <input
                    id="register-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={
                      role === 'teacher'
                        ? 'VD: 0914.xxx.xxx (để phối hợp phê duyệt đề tài KHKT)'
                        : role === 'station_staff'
                        ? 'VD: 0905.xxx.xxx (đường dây nóng trực phòng Đội)'
                        : 'VD: 0905.xxx.xxx (để nhận tin nhắn khi có sách vở)'
                    }
                    className="w-full text-xs px-3.5 py-2.5 pl-9 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  {role === 'teacher'
                    ? '* Dùng để liên hệ nội bộ giữa Ban Giám hiệu, Giáo viên và Đội trực trạm.'
                    : role === 'station_staff'
                    ? '* Giúp học sinh và giáo viên liên hệ hỗ trợ khi đến nhận/gửi đồ tại trạm.'
                    : '* Dùng để gửi tin nhắn thông báo khi bốc thăm trúng đồ dùng hoặc lịch hẹn nhận đồ.'}
                </p>
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
