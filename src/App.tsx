import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Dashboard from '@/pages/Dashboard';
import Residents from '@/pages/Residents';
import Household from '@/pages/Household';
import Document from '@/pages/Document';
import ManageAccount from '@/pages/ManageAccount';
import ActivityLogs from '@/pages/ActivityLogs';
import Archived from '@/pages/Archived';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import SuccessToast from '@/components/ui/SuccessToast';
import { useAuth } from '@/context/AuthContext';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const [isNavigationBlocked, setIsNavigationBlocked] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState({ show: false, message: '' });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && location.pathname !== '/login') {
      navigate('/login');
    }
  }, [user, location.pathname, navigate]);

  // Map paths to tab names for Sidebar highlighting
  const getActiveTab = (pathname: string) => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname.startsWith('/residents')) return 'Residents';
    if (pathname.startsWith('/household')) return 'Household';
    if (pathname.startsWith('/document')) return 'Document';
    if (pathname.startsWith('/manage-account')) return 'Manage Account';
    if (pathname.startsWith('/activity-logs')) return 'Activity Logs';
    if (pathname.startsWith('/archived')) return 'Archived';
    if (pathname.startsWith('/settings')) return 'Settings';
    return 'Dashboard';
  };

  const activeTab = getActiveTab(location.pathname);

  const handleShowSuccess = useCallback((message: string) => {
    setSuccessToast({ show: true, message });
  }, []);

  const handleCloseToast = useCallback(() => {
    setSuccessToast(prev => ({ ...prev, show: false }));
  }, []);

  const tabToPath: Record<string, string> = {
    'Dashboard': '/dashboard',
    'Residents': '/residents',
    'Household': '/household',
    'Document': '/document',
    'Manage Account': '/manage-account',
    'Activity Logs': '/activity-logs',
    'Archived': '/archived',
    'Settings': '/settings',
    'Logout': '/logout'
  };

  // Handle tab change with validation
  const handleTabChange = (tab: string) => {
    if (tab === 'Logout') {
        logout();
        return;
    }

    const targetPath = tabToPath[tab];
    if (!targetPath) return;

    if (isNavigationBlocked && tab !== activeTab) {
      setPendingTab(tab);
      setShowUnsavedModal(true);
    } else {
      navigate(targetPath);
    }
  };

  const confirmTabChange = () => {
    if (pendingTab) {
      const targetPath = tabToPath[pendingTab];
      if (targetPath) {
          navigate(targetPath);
      }
      setIsNavigationBlocked(false);
      setShowUnsavedModal(false);
      setPendingTab(null);
    }
  };

  // Determine header title based on active tab
  const getHeaderTitle = () => {
      switch(activeTab) {
          case 'Residents': return 'Resident'; // Singular as per screenshot
          default: return activeTab;
      }
  };

  if (location.pathname === '/login') {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  if (!user) return null; // Or loading spinner

  return (
    <div className="flex h-screen w-full bg-[#F3F4F6] overflow-hidden print:overflow-visible print:bg-white print:h-auto">
      <div className="print:hidden">
        <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />
      </div>
      
      {/* Main Content Wrapper */}
      <div className="flex-1 ml-64 xl:ml-72 flex flex-col h-full overflow-hidden transition-all duration-300 print:ml-0 print:w-full print:h-auto print:overflow-visible">
        
        {/* Header - White Container */}
        <header className="bg-white px-8 py-4 flex justify-between items-center shadow-sm shrink-0 z-20 border-b border-gray-100 print:hidden">
          <h2 className="text-2xl xl:text-3xl font-bold text-[#1F2937] leading-tight">{getHeaderTitle()}</h2>
          
          <div className="flex items-center gap-3 xl:gap-4">
            <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-full overflow-hidden border-2 border-gray-100 shadow-sm shrink-0">
                <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                    alt="User Profile" 
                    className="w-full h-full object-cover bg-gray-50"
                />
            </div>
            <div className="hidden md:block text-left">
                <p className="text-sm xl:text-base font-bold text-gray-900 leading-tight">{user.firstName} {user.lastName}</p>
                <p className="text-xs xl:text-sm text-gray-500 font-medium">{user.role}</p>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-hidden p-6 xl:p-8 flex flex-col print:overflow-visible print:p-0 print:block">
            <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={
                    <div className="overflow-y-auto h-full pr-2 custom-scrollbar">
                        <Dashboard />
                    </div>
                } />
                
                <Route path="/residents" element={
                    <div className="flex-1 overflow-hidden h-full">
                        <Residents 
                        setIsNavigationBlocked={setIsNavigationBlocked} 
                        onShowSuccess={handleShowSuccess}
                        />
                    </div>
                } />

                <Route path="/household" element={
                    <div className="flex-1 overflow-hidden h-full">
                        <Household onShowSuccess={handleShowSuccess} />
                    </div>
                } />

                <Route path="/document" element={
                    <div className="flex-1 overflow-hidden h-full print:overflow-visible print:h-auto">
                        <Document />
                    </div>
                } />

                <Route path="/manage-account" element={
                    <div className="flex-1 overflow-hidden h-full">
                        <ManageAccount 
                            onShowSuccess={handleShowSuccess}
                            setIsNavigationBlocked={setIsNavigationBlocked}
                        />
                    </div>
                } />

                <Route path="/activity-logs" element={
                    <div className="flex-1 overflow-hidden h-full">
                        <ActivityLogs />
                    </div>
                } />

                <Route path="/archived" element={
                    <div className="flex-1 overflow-hidden h-full">
                        <Archived />
                    </div>
                } />

                <Route path="/settings" element={
                    <div className="flex-1 overflow-hidden h-full">
                        <Settings 
                            onShowSuccess={handleShowSuccess}
                            setIsNavigationBlocked={setIsNavigationBlocked}
                        />
                    </div>
                } />

                <Route path="*" element={
                    <div className="flex items-center justify-center h-full text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                        Content for {activeTab} not implemented yet.
                    </div>
                } />
            </Routes>
        </main>
      </div>

      <ConfirmationModal 
        isOpen={showUnsavedModal}
        onClose={() => setShowUnsavedModal(false)}
        onConfirm={confirmTabChange}
      />

      <SuccessToast 
        message={successToast.message}
        isVisible={successToast.show}
        onClose={handleCloseToast}
      />
    </div>
  );
};

export default App;