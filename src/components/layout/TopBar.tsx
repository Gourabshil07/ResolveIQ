import React, { useState, useEffect } from 'react';
import { Menu, LogOut, ChevronDown, Bell, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, NotificationItem } from '../../services/api';

interface TopBarProps {
  currentPage: string;
  onNavigate: (page: string, params?: { incidentId?: string }) => void;
  onOpenSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentPage,
  onNavigate,
  onOpenSidebar,
}) => {
  const { currentUser, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch {
      // silent fallback
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 8000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const handleMarkRead = async (id: string, incidentId?: string) => {
    try {
      await api.markNotificationRead(id);
      await fetchNotifications();
      if (incidentId) {
        setShowNotificationsMenu(false);
        onNavigate('incident-details', { incidentId });
      }
    } catch {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      await fetchNotifications();
    } catch {
      // silent
    }
  };

  const getPageTitle = (page: string): string => {
    switch (page) {
      case 'dashboard':
        return 'Dashboard';
      case 'create-incident':
        return 'Create Incident';
      case 'my-tickets':
        return 'My Incidents';
      case 'all-incidents':
        return 'All Incidents';
      case 'incident-details':
        return 'Incident Details';
      case 'engineer-workspace':
        return 'Engineer Workbench';
      case 'admin-users':
        return 'User Directory';
      default:
        return 'Incident Console';
    }
  };

  const displayName = currentUser?.name || 'User';
  const displayRole = currentUser?.role ? currentUser.role.replace('_', ' ') : 'IT USER';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Zone 1: Mobile Hamburger & Context Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg lg:hidden cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-slate-900 tracking-tight">ResolveIQ</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600 font-medium truncate max-w-[200px] sm:max-w-xs">
            {getPageTitle(currentPage)}
          </span>
        </div>
      </div>

      {/* Zone 2: Empty Spacer */}
      <div className="flex-1" />

      {/* Zone 3: Notifications, Active User Name & Profile Menu */}
      <div className="flex items-center gap-3 shrink-0">
        {/* User Role Indicator */}
        <div className="hidden sm:inline-flex items-center px-2.5 py-1 bg-slate-100 rounded-md text-xs text-slate-700 font-mono font-medium">
          {displayRole}
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotificationsMenu(!showNotificationsMenu);
              setShowUserMenu(false);
              fetchNotifications();
            }}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotificationsMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in duration-150">
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No notifications
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleMarkRead(item.id, item.incidentId)}
                      className={`p-3.5 transition-colors cursor-pointer hover:bg-slate-50 ${
                        !item.isRead ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs font-semibold text-slate-900">{item.title}</div>
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{new Date(item.createdAt).toLocaleString()}</span>
                        {!item.isRead && (
                          <span className="text-blue-600 font-medium hover:underline">
                            View details &rarr;
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotificationsMenu(false);
            }}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer group"
            aria-label="User profile menu"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-xs">
              {initial}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                {displayName}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {displayRole}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in duration-150">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white shadow-xs">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 truncate">{displayName}</div>
                    <div className="text-[11px] text-slate-500 truncate">{currentUser?.email}</div>
                    <div className="mt-1 text-[10px] font-mono text-blue-700 font-semibold">
                      {displayRole}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-2">
                <button
                  onClick={async () => {
                    setShowUserMenu(false);
                    await logout();
                    onNavigate('login');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
