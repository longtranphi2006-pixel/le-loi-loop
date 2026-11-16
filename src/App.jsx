import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ItemDetailPage from './pages/ItemDetailPage';
import DonatePage from './pages/DonatePage';
import MyActivityPage from './pages/MyActivityPage';
import StationPage from './pages/StationPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import LoopMatchPage from './pages/LoopMatchPage';
import LabPage from './pages/LabPage';
import ProtectedRoute from './components/ProtectedRoute';
import AuthModal from './components/AuthModal';
import { CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react';

function MainContent() {
  const { notification, syncStatus, syncError, isAuthModalOpen, openAuthModal, closeAuthModal } = useApp();
  const [activePage, setActivePage] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);

  // Hỗ trợ nhận diện URL /register hoặc /login (cả pathname và hash)
  useEffect(() => {
    const checkAuthUrl = () => {
      const path = (window.location.pathname || '').toLowerCase();
      const hash = (window.location.hash || '').toLowerCase();
      if (path.includes('/register') || hash.includes('register')) {
        openAuthModal('register');
      } else if (path.includes('/login') || hash.includes('login')) {
        openAuthModal('login');
      }
    };
    checkAuthUrl();
    window.addEventListener('hashchange', checkAuthUrl);
    window.addEventListener('popstate', checkAuthUrl);
    return () => {
      window.removeEventListener('hashchange', checkAuthUrl);
      window.removeEventListener('popstate', checkAuthUrl);
    };
  }, [openAuthModal]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-gray-800">
      {/* CLOUD SYNC ERROR BANNER (NẾU MẤT ĐỒNG BỘ) */}
      {syncStatus === 'sync_error' && (
        <div className="bg-red-600 text-white text-xs py-2 px-4 text-center font-bold flex items-center justify-center gap-2 shadow-sm animate-pulse">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>CẢNH BÁO MẤT ĐỒNG BỘ CLOUD: {syncError || 'Không thể kết nối đến Supabase.'}</span>
        </div>
      )}

      {/* MAIN HEADER & NAVBAR */}
      <Navbar activePage={activePage} setActivePage={setActivePage} />

      {/* AUTH MODAL CHO ĐĂNG KÝ / ĐĂNG NHẬP */}
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />

      {/* 3. TOAST NOTIFICATION */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-bounce duration-300">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold border ${
              notification.type === 'error'
                ? 'bg-red-600 text-white border-red-700'
                : notification.type === 'warning'
                ? 'bg-amber-500 text-amber-950 border-amber-600'
                : notification.type === 'info'
                ? 'bg-blue-600 text-white border-blue-700'
                : 'bg-emerald-700 text-white border-emerald-800'
            }`}
          >
            {notification.type === 'error' ? (
              <XCircle className="w-4 h-4 shrink-0" />
            ) : notification.type === 'warning' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : notification.type === 'info' ? (
              <Info className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* 4. MAIN PAGE CONTENT */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full">
        {activePage === 'home' && (
          <HomePage
            setActivePage={setActivePage}
            setSelectedCategory={setSelectedCategory}
            setSelectedItem={setSelectedItem}
          />
        )}

        {activePage === 'catalog' && (
          <CatalogPage
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            setSelectedItem={setSelectedItem}
            setActivePage={setActivePage}
          />
        )}

        {activePage === 'detail' && (
          <ItemDetailPage
            item={selectedItem}
            setActivePage={setActivePage}
          />
        )}

        {activePage === 'donate' && (
          <ProtectedRoute allowedRoles={['student', 'teacher', 'station_staff', 'admin']} setActivePage={setActivePage}>
            <DonatePage setActivePage={setActivePage} />
          </ProtectedRoute>
        )}

        {activePage === 'my-activity' && (
          <ProtectedRoute allowedRoles={['student', 'teacher', 'station_staff', 'admin']} setActivePage={setActivePage}>
            <MyActivityPage
              setActivePage={setActivePage}
              setSelectedItem={setSelectedItem}
            />
          </ProtectedRoute>
        )}

        {activePage === 'station' && (
          <StationPage
            setActivePage={setActivePage}
            setSelectedItem={setSelectedItem}
          />
        )}

        {activePage === 'loopmatch' && (
          <LoopMatchPage />
        )}

        {activePage === 'admin' && (
          <ProtectedRoute allowedRoles={['teacher', 'station_staff', 'admin']} setActivePage={setActivePage}>
            <AdminDashboardPage
              setActivePage={setActivePage}
              setSelectedItem={setSelectedItem}
            />
          </ProtectedRoute>
        )}

        {activePage === 'lab' && (
          <LabPage />
        )}
      </main>

      {/* 5. FOOTER */}
      <footer className="bg-white border-t border-emerald-100 py-8 px-4 sm:px-6 lg:px-8 mt-auto text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="space-y-1">
            <div className="font-bold text-gray-900 flex items-center justify-center md:justify-start gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>LÊ LỢI LOOP – "Đồ cũ trao tay, Giá trị ở lại"</span>
            </div>
            <p>
              Dự án Nghiên cứu Khoa học Kỹ thuật THCS cấp Thành phố Đà Nẵng • Trường THCS Lê Lợi, Quận Hải Châu
            </p>
          </div>
          <div className="text-gray-400">
            Hệ thống Vận hành Thực tế • Đồng bộ Supabase PostgreSQL Cloud • Trường THCS Lê Lợi, Đà Nẵng
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

