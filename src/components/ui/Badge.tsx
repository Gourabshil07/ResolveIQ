import React from 'react';
import { Category, Priority, Role, Status } from '../../types';
import { 
  AlertOctagon, 
  AlertTriangle, 
  Clock, 
  Info, 
  CheckCircle2, 
  CircleDashed, 
  PlayCircle, 
  Archive,
  Shield,
  Wrench,
  UserCheck
} from 'lucide-react';

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'sm' }) => {
  const configs: Record<string, { label: string; textClass: string; bgClass: string; icon: React.ReactNode }> = {
    Critical: {
      label: 'Critical',
      textClass: 'text-red-700 font-semibold',
      bgClass: 'bg-red-50 border border-red-200/70',
      icon: <AlertOctagon className={size === 'sm' ? 'w-3 h-3 text-red-600' : 'w-3.5 h-3.5 text-red-600'} />
    },
    High: {
      label: 'High',
      textClass: 'text-amber-800 font-medium',
      bgClass: 'bg-amber-50 border border-amber-200/70',
      icon: <AlertTriangle className={size === 'sm' ? 'w-3 h-3 text-amber-600' : 'w-3.5 h-3.5 text-amber-600'} />
    },
    Medium: {
      label: 'Medium',
      textClass: 'text-blue-700 font-medium',
      bgClass: 'bg-blue-50 border border-blue-200/70',
      icon: <Clock className={size === 'sm' ? 'w-3 h-3 text-blue-600' : 'w-3.5 h-3.5 text-blue-600'} />
    },
    Low: {
      label: 'Low',
      textClass: 'text-slate-600 font-normal',
      bgClass: 'bg-slate-100 border border-slate-200/70',
      icon: <Info className={size === 'sm' ? 'w-3 h-3 text-slate-500' : 'w-3.5 h-3.5 text-slate-500'} />
    },
    P1_CRITICAL: {
      label: 'Critical',
      textClass: 'text-red-700 font-semibold',
      bgClass: 'bg-red-50 border border-red-200/70',
      icon: <AlertOctagon className={size === 'sm' ? 'w-3 h-3 text-red-600' : 'w-3.5 h-3.5 text-red-600'} />
    },
    P2_HIGH: {
      label: 'High',
      textClass: 'text-amber-800 font-medium',
      bgClass: 'bg-amber-50 border border-amber-200/70',
      icon: <AlertTriangle className={size === 'sm' ? 'w-3 h-3 text-amber-600' : 'w-3.5 h-3.5 text-amber-600'} />
    },
    P3_MEDIUM: {
      label: 'Medium',
      textClass: 'text-blue-700 font-medium',
      bgClass: 'bg-blue-50 border border-blue-200/70',
      icon: <Clock className={size === 'sm' ? 'w-3 h-3 text-blue-600' : 'w-3.5 h-3.5 text-blue-600'} />
    },
    P4_LOW: {
      label: 'Low',
      textClass: 'text-slate-600 font-normal',
      bgClass: 'bg-slate-100 border border-slate-200/70',
      icon: <Info className={size === 'sm' ? 'w-3 h-3 text-slate-500' : 'w-3.5 h-3.5 text-slate-500'} />
    }
  };

  const c = configs[priority] || configs.Medium;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md ${padding} ${c.bgClass} ${c.textClass} whitespace-nowrap shrink-0`}>
      {c.icon}
      <span>{c.label}</span>
    </span>
  );
};

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const configs: Record<string, { label: string; textClass: string; bgClass: string; icon: React.ReactNode }> = {
    OPEN: {
      label: 'Open',
      textClass: 'text-amber-800 font-medium',
      bgClass: 'bg-amber-50 border border-amber-200/70',
      icon: <CircleDashed className="w-3 h-3 text-amber-600" />
    },
    NEW: {
      label: 'Open',
      textClass: 'text-amber-800 font-medium',
      bgClass: 'bg-amber-50 border border-amber-200/70',
      icon: <CircleDashed className="w-3 h-3 text-amber-600" />
    },
    TRIAGED: {
      label: 'Triaged',
      textClass: 'text-sky-800 font-medium',
      bgClass: 'bg-sky-50 border border-sky-200/70',
      icon: <Clock className="w-3 h-3 text-sky-600" />
    },
    IN_PROGRESS: {
      label: 'In Progress',
      textClass: 'text-blue-800 font-medium',
      bgClass: 'bg-blue-50 border border-blue-200/70',
      icon: <PlayCircle className="w-3 h-3 text-blue-600" />
    },
    RESOLVED: {
      label: 'Resolved',
      textClass: 'text-emerald-700 font-medium',
      bgClass: 'bg-emerald-50 border border-emerald-200/70',
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />
    },
    CLOSED: {
      label: 'Closed',
      textClass: 'text-slate-600 font-normal',
      bgClass: 'bg-slate-100 border border-slate-200/70',
      icon: <Archive className="w-3 h-3 text-slate-500" />
    }
  };

  const c = configs[status] || configs.OPEN;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md ${padding} ${c.bgClass} ${c.textClass} whitespace-nowrap shrink-0`}>
      {c.icon}
      <span>{c.label}</span>
    </span>
  );
};

export const CategoryBadge: React.FC<{ category: Category }> = ({ category }) => {
  const label = category.replace('_', ' ');
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono text-slate-600 bg-slate-100 border border-slate-200/60 uppercase">
      {label}
    </span>
  );
};

export const RoleBadge: React.FC<{ role: Role }> = ({ role }) => {
  const configs: Record<string, { label: string; textClass: string; bgClass: string; icon: React.ReactNode }> = {
    IT_USER: {
      label: 'IT User',
      textClass: 'text-slate-700 font-medium',
      bgClass: 'bg-slate-100 border border-slate-200',
      icon: <UserCheck className="w-3 h-3 text-slate-500" />
    },
    SUPPORT_ENGINEER: {
      label: 'Support Engineer',
      textClass: 'text-blue-700 font-semibold',
      bgClass: 'bg-blue-50 border border-blue-200',
      icon: <Wrench className="w-3 h-3 text-blue-600" />
    },
    EMPLOYEE: {
      label: 'IT User',
      textClass: 'text-slate-700 font-medium',
      bgClass: 'bg-slate-100 border border-slate-200',
      icon: <UserCheck className="w-3 h-3 text-slate-500" />
    },
    ENGINEER: {
      label: 'Support Engineer',
      textClass: 'text-blue-700 font-semibold',
      bgClass: 'bg-blue-50 border border-blue-200',
      icon: <Wrench className="w-3 h-3 text-blue-600" />
    },
    ADMIN: {
      label: 'Administrator',
      textClass: 'text-purple-700 font-semibold',
      bgClass: 'bg-purple-50 border border-purple-200',
      icon: <Shield className="w-3 h-3 text-purple-600" />
    }
  };

  const c = configs[role] || configs.IT_USER;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs ${c.bgClass} ${c.textClass} whitespace-nowrap`}>
      {c.icon}
      <span>{c.label}</span>
    </span>
  );
};
