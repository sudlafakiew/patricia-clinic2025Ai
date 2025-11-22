import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AppointmentPage from './components/AppointmentPage';
import CustomerPage from './components/CustomerPage';
import ServicesPage from './components/ServicesPage';
import AIConsultant from './components/AIConsultant';
import InventoryPage from './components/InventoryPage';
import POSPage from './components/POSPage';
import LoginPage from './components/LoginPage';
import SetupPage from './components/SetupPage';
import SettingsPage from './components/SettingsPage';
import DatabaseSetupGuide from './components/DatabaseSetupGuide';
import SalesReportPage from './components/SalesReportPage';
import { ClinicProvider, useClinic } from './context/ClinicContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { isConfigured } from './lib/supabaseClient';
import { Menu, Sparkles, PanelLeftOpen } from 'lucide-react';

// Inner layout to consume ClinicContext
const ClinicLayout: React.FC = () => {
  const { dbConnectionError, isLoadingData, skipLoadingAndContinue } = useClinic();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [showLoadingTimeout, setShowLoadingTimeout] = useState(false);

  // Show timeout message after 10 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoadingData) {
        setShowLoadingTimeout(true);
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [isLoadingData]);

  // Reset timeout message when loading completes
  React.useEffect(() => {
    if (!isLoadingData) {
      setShowLoadingTimeout(false);
    }
  }, [isLoadingData]);

  // Check for missing tables error
  if (dbConnectionError === 'MISSING_TABLES') {
    return <DatabaseSetupGuide />;
  }

  // Show loading overlay while data is being fetched
  if (isLoadingData) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4 max-w-sm mx-auto px-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-cyan-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-200 animate-pulse">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-800">กำลังโหลดข้อมูลคลินิก...</p>
            <p className="text-xs text-gray-500 mt-1">Loading clinic data...</p>
          </div>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
          {showLoadingTimeout && (
            <div className="w-full space-y-3">
              <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200 text-center">
                <p className="font-medium mb-1">⏱️ โหลดข้อมูลใช้เวลานานกว่าปกติ</p>
                <p className="text-xs">ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรือ Supabase credentials</p>
              </div>
              <button
                onClick={skipLoadingAndContinue}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                ▶ ดำเนินการต่อไป (Continue Anyway)
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const handleSidebarClose = () => {
    setIsMobileSidebarOpen(false);
    setIsDesktopSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 md:hidden transition-opacity" 
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-30 h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out
          md:relative 
          ${isMobileSidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'} 
          md:translate-x-0 md:shadow-none
          ${isDesktopSidebarOpen ? 'md:w-64' : 'md:w-0 md:overflow-hidden md:border-none'}
        `}
      >
        <div className="h-full w-64">
            <Sidebar onClose={handleSidebarClose} />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Desktop Open Sidebar Button */}
        {!isDesktopSidebarOpen && (
            <button 
              onClick={() => setIsDesktopSidebarOpen(true)}
              className="hidden md:flex absolute top-4 left-4 z-10 bg-white p-2 rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
              title="Open Sidebar"
            >
              <PanelLeftOpen size={24} />
            </button>
        )}

        {/* Mobile Header */}
        <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between md:hidden flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center text-white">
                  <Sparkles size={16} />
              </div>
              <h1 className="font-bold text-gray-800">Patricia Clinic</h1>
            </div>
            <button 
              onClick={() => setIsMobileSidebarOpen(true)} 
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/appointments" element={<AppointmentPage />} />
            <Route path="/customers" element={<CustomerPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/pos" element={<POSPage />} />
            <Route path="/sales-report" element={<SalesReportPage />} />
            <Route path="/ai-consultant" element={<AIConsultant />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const ProtectedLayout: React.FC = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-cyan-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-200 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-800">Patricia Clinic Manager</p>
            <p className="text-sm text-gray-500 mt-1">กำลังโหลดข้อมูล...</p>
          </div>
          <div className="flex gap-1 mt-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ClinicProvider>
        <ClinicLayout />
    </ClinicProvider>
  );
};

const App: React.FC = () => {
  if (!isConfigured()) {
    return <SetupPage />;
  }

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;