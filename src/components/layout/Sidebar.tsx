import React from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Ticket, 
  ListFilter, 
  Users, 
  LogOut,
  Star,
  Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpen,
  onClose
}) => {
  const { currentUser, logout } = useAuth();

  interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    roles: Role[];
  }

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['IT_USER', 'SUPPORT_ENGINEER', 'ADMIN', 'EMPLOYEE', 'ENGINEER']
    },
    {
      id: 'create-incident',
      label: 'Create Incident',
      icon: PlusCircle,
      roles: ['IT_USER', 'EMPLOYEE']
    },
    {
      id: 'my-tickets',
      label: 'My Incidents',
      icon: Ticket,
      roles: ['IT_USER', 'EMPLOYEE']
    },
    {
      id: 'all-incidents',
      label: 'All Incidents',
      icon: ListFilter,
      roles: ['SUPPORT_ENGINEER', 'ADMIN', 'ENGINEER']
    },
    {
      id: 'admin-users',
      label: 'User Management',
      icon: Users,
      roles: ['ADMIN']
    },
    {
      id: 'admin-feedback',
      label: 'Feedback',
      icon: Star,
      roles: ['ADMIN']
    },
    {
      id: 'admin-activity',
      label: 'Activity Log',
      icon: Activity,
      roles: ['ADMIN']
    }
  ];

  const currentRole = currentUser?.role || 'IT_USER';
  const visibleNavItems = navItems.filter(item => item.roles.includes(currentRole));

  const handleNavClick = (pageId: string) => {
    onNavigate(pageId);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const displayName = currentUser?.name || 'User';
  const displayRole = currentUser?.role ? currentUser.role.replace('_', ' ') : 'IT USER';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Dark Navy Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#0B132B] text-slate-200 border-r border-[#1C2541] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Lockup */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#1C2541] shrink-0">
          <div 
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:bg-blue-500 transition-colors">
              R
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white">ResolveIQ</span>
              <span className="block text-[10px] text-blue-400 font-mono tracking-wider uppercase">IT Operations</span>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase font-mono">
            Navigation
          </div>

          {visibleNavItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-[#1C2541]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* User Profile Card with Real Name */}
        <div className="p-3 border-t border-[#1C2541] bg-[#080E21] shrink-0">
          <div className="flex items-center justify-between p-2 rounded-lg bg-[#0E1738] border border-[#1C2541]">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                {initial}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-white truncate" title={displayName}>
                  {displayName}
                </div>
                <div className="text-[10px] text-blue-400 font-mono">
                  {displayRole}
                </div>
              </div>
            </div>

            <button
              onClick={async () => {
                await logout();
                onNavigate('login');
              }}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-[#1C2541] rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
