import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Home, 
  FileText, 
  UserCog, 
  List, 
  Archive, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { SidebarProps } from '@/types';
import { useAuth } from '@/context/AuthContext';

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  const allMenuItems = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Residents', icon: Users },
    { label: 'Household', icon: Home },
    { label: 'Document', icon: FileText },
    { label: 'Manage Account', icon: UserCog },
    { label: 'Activity Logs', icon: List },
  ];

  const allBottomItems = [
    { label: 'Archived', icon: Archive },
    { label: 'Settings', icon: Settings },
    { label: 'Logout', icon: LogOut },
  ];

  const getVisibleItems = (items: typeof allMenuItems) => {
    if (!user) return [];
    if (user.role === 'SuperAdmin') return items;

    const allowedLabels = ['Dashboard']; // Always allowed

    if (user.permission === 'Resident Access') {
      allowedLabels.push('Residents', 'Household');
    } else if (user.permission === 'Document Access') {
      allowedLabels.push('Document');
    } else if (user.permission === 'Resident & Document Access') {
      allowedLabels.push('Residents', 'Document', 'Household');
    }

    return items.filter(item => allowedLabels.includes(item.label));
  };

  const getVisibleBottomItems = (items: typeof allBottomItems) => {
    if (!user) return [];
    if (user.role === 'SuperAdmin') return items;

    const allowedLabels = ['Logout'];

    if (user.permission !== 'Document Access') {
      allowedLabels.push('Archived');
    }

    return items.filter(item => allowedLabels.includes(item.label));
  };

  const visibleMenuItems = getVisibleItems(allMenuItems);
  const visibleBottomItems = getVisibleBottomItems(allBottomItems);

  const handleItemClick = (label: string) => {
    if (label === 'Logout') {
      logout();
    } else {
      setActiveTab(label);
    }
  };

  return (
    <div className="w-64 xl:w-72 bg-white h-screen fixed left-0 top-0 flex flex-col border-r border-gray-100 z-10 transition-all duration-300">
      {/* Logo Area */}
      <div className="p-6 xl:p-8 mb-2">
        <h1 className="text-2xl xl:text-3xl font-bold text-blue-600 whitespace-nowrap">
          Barangay <span className="text-gray-800">418</span>
        </h1>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 px-4 xl:px-6 space-y-2 xl:space-y-3">
        {visibleMenuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => handleItemClick(item.label)}
            className={`w-full flex items-center gap-4 xl:gap-5 px-4 xl:px-5 py-3 xl:py-4 rounded-xl text-sm xl:text-base font-medium transition-all ${
              activeTab === item.label
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <item.icon className="w-5 h-5 xl:w-6 xl:h-6" strokeWidth={activeTab === item.label ? 2 : 1.5} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Bottom Menu */}
      <div className="p-4 xl:p-6 space-y-2 xl:space-y-3 mb-4">
        {visibleBottomItems.map((item) => (
          <button
            key={item.label}
            onClick={() => handleItemClick(item.label)}
            className={`w-full flex items-center gap-4 xl:gap-5 px-4 xl:px-5 py-3 xl:py-4 rounded-xl text-sm xl:text-base font-medium transition-all ${
              activeTab === item.label
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <item.icon className="w-5 h-5 xl:w-6 xl:h-6" strokeWidth={activeTab === item.label ? 2 : 1.5} />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;