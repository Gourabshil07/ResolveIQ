import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCheck, 
  AlertOctagon, 
  Clock, 
  CheckCircle2, 
  Info,
  ChevronRight
} from 'lucide-react';
import { incidentService } from '../services/incidentService';
import { NotificationItem } from '../types';
import { EmptyState } from '../components/ui/EmptyState';

interface NotificationsPageProps {
  onNavigate: (page: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    const refresh = () => setNotifications(incidentService.getNotifications());
    refresh();
    return incidentService.subscribe(refresh);
  }, []);

  const displayedNotifs = filter === 'unread' 
    ? notifications.filter(n => !n.read) 
    : notifications;

  const handleMarkAllRead = () => {
    incidentService.markAllNotificationsAsRead();
  };

  const handleNotificationClick = (item: NotificationItem) => {
    incidentService.markNotificationAsRead(item.id);
    if (item.incidentId) {
      onNavigate(`incident-details?id=${item.incidentId}`);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational alerts, SLA breach warnings, and ticket assignment dispatches.
          </p>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Mark all as read</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
            filter === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
            filter === 'unread' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Unread ({notifications.filter(n => !n.read).length})
        </button>
      </div>

      {/* Notifications List */}
      {displayedNotifs.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All caught up"
          description="There are no notifications matching your active filter."
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
          {displayedNotifs.map(item => (
            <div
              key={item.id}
              onClick={() => handleNotificationClick(item)}
              className={`p-4 flex items-start gap-3.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                !item.read ? 'bg-blue-50/40' : ''
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {item.type === 'ALERT' && (
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                    <AlertOctagon className="w-4 h-4" />
                  </div>
                )}
                {item.type === 'SLA_WARNING' && (
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                )}
                {item.type === 'RESOLVED' && (
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                {(item.type === 'ASSIGNMENT' || item.type === 'SYSTEM') && (
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Info className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className={`text-xs ${!item.read ? 'font-bold text-slate-900' : 'font-medium text-slate-800'}`}>
                    {item.title}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">
                  {item.message}
                </p>
                {item.incidentId && (
                  <div className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-medium pt-1">
                    <span>Inspect Ticket {item.incidentId}</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
