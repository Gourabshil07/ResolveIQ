import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Users, 
  UserCheck, 
  ShieldAlert,
  Trash2,
  FileText,
  X,
  Search,
  RotateCcw,
  Star,
  Activity,
  Layers,
  BarChart3,
  PieChart,
  UserX,
  ArrowRight,
  ChevronRight,
  Filter,
  Check,
  Shield,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  api, 
  Incident, 
  DashboardSummary, 
  UserProfile, 
  AdminAnalytics, 
  AdminFeedbackItem, 
  AuditLogItem,
  NotificationItem
} from '../services/api';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
  initialAdminTab?: 'INCIDENTS' | 'USERS' | 'FEEDBACK' | 'AUDIT';
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ 
  onNavigate,
  initialAdminTab = 'INCIDENTS'
}) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';
  const isEngineer = currentUser?.role === 'SUPPORT_ENGINEER';
  const isITUser = currentUser?.role === 'IT_USER';

  // Base State
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [engineers, setEngineers] = useState<UserProfile[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Admin Specific State
  const [adminTab, setAdminTab] = useState<'INCIDENTS' | 'USERS' | 'FEEDBACK' | 'AUDIT'>(initialAdminTab);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [adminFeedbacks, setAdminFeedbacks] = useState<AdminFeedbackItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // Incident Filtering in Admin View
  const [incSearch, setIncSearch] = useState('');
  const [incStatusFilter, setIncStatusFilter] = useState<string>('ALL');
  const [incPriorityFilter, setIncPriorityFilter] = useState<string>('ALL');
  const [incCategoryFilter, setIncCategoryFilter] = useState<string>('ALL');

  // User Management Filtering in Admin View
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('ALL');

  // Feedback Filtering in Admin View
  const [fbRatingFilter, setFbRatingFilter] = useState<string>('ALL');

  // Delete & Confirmation Modals
  const [deleteConfirmIncident, setDeleteConfirmIncident] = useState<Incident | null>(null);
  const [deletingIncident, setDeletingIncident] = useState(false);

  const [userActionTarget, setUserActionTarget] = useState<{ user: UserProfile; action: 'BLOCK' | 'UNBLOCK' | 'DELETE' } | null>(null);
  const [userActionLoading, setUserActionLoading] = useState(false);

  // IT User Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<'Network' | 'Server' | 'Software' | 'Hardware' | 'Other'>('Network');
  const [newPriority, setNewPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState<string | null>(null);
  const [newAttachmentName, setNewAttachmentName] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Fetch Data Function
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, incList] = await Promise.all([
        api.getDashboardSummary(),
        api.getIncidents(),
      ]);
      setSummary(sumData);
      setIncidents(incList);

      if (isAdmin) {
        const [engList, uList, analyticsData, fbData, logsData, notifsData] = await Promise.all([
          api.getEngineers(),
          api.getUsers(),
          api.getAdminAnalytics(),
          api.getAdminFeedbackList(),
          api.getAdminAuditLogs(),
          api.getNotifications(),
        ]);
        setEngineers(engList as UserProfile[]);
        setUsersList(uList);
        setAnalytics(analyticsData);
        setAdminFeedbacks(fbData);
        setAuditLogs(logsData);
        setNotifications(notifsData.notifications || []);
        setUnreadNotifCount(notifsData.unreadCount || 0);
      } else if (isEngineer) {
        const engList = await api.getEngineers();
        setEngineers((engList as UserProfile[]).filter((e) => e.role === 'SUPPORT_ENGINEER'));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isEngineer]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Admin Assign/Reassign Incident
  const handleAdminAssignIncident = async (incidentId: string, assigneeId: string) => {
    try {
      const targetAssignee = assigneeId === 'UNASSIGNED' ? null : assigneeId;
      const updated = await api.assignIncident(incidentId, targetAssignee);
      setIncidents((prev) => prev.map((inc) => (inc.id === updated.id ? updated : inc)));
      setFeedbackMessage({
        type: 'success',
        text: `Incident ${updated.ticketNumber} successfully ${targetAssignee ? 'assigned to ' + updated.assigneeName : 'unassigned'}.`,
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
      fetchData();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to reassign incident.' });
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  // Handle Incident Deletion
  const handleConfirmDeleteIncident = async () => {
    if (!deleteConfirmIncident) return;
    setDeletingIncident(true);
    try {
      await api.deleteIncident(deleteConfirmIncident.id);
      setIncidents((prev) => prev.filter((i) => i.id !== deleteConfirmIncident.id));
      setDeleteConfirmIncident(null);
      setFeedbackMessage({
        type: 'success',
        text: `Incident record ${deleteConfirmIncident.ticketNumber} deleted successfully.`,
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
      fetchData();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to delete incident.' });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } finally {
      setDeletingIncident(false);
    }
  };

  // Handle User Status / Block / Delete
  const handleConfirmUserAction = async () => {
    if (!userActionTarget) return;
    setUserActionLoading(true);
    const { user, action } = userActionTarget;
    try {
      if (action === 'BLOCK') {
        await api.updateUserStatus(user.id, 'BLOCKED');
        setFeedbackMessage({ type: 'success', text: `Account for ${user.fullName} has been blocked.` });
      } else if (action === 'UNBLOCK') {
        await api.updateUserStatus(user.id, 'ACTIVE');
        setFeedbackMessage({ type: 'success', text: `Account for ${user.fullName} has been unblocked.` });
      } else if (action === 'DELETE') {
        const res = await api.deleteUser(user.id);
        setFeedbackMessage({ type: 'success', text: res.message || `Account for ${user.fullName} archived.` });
      }
      setUserActionTarget(null);
      setTimeout(() => setFeedbackMessage(null), 4000);
      fetchData();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || `Failed to execute ${action.toLowerCase()} action.` });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } finally {
      setUserActionLoading(false);
    }
  };

  // Filtered Incidents for Tab 1
  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch =
      inc.ticketNumber.toLowerCase().includes(incSearch.toLowerCase()) ||
      inc.title.toLowerCase().includes(incSearch.toLowerCase()) ||
      inc.reporterName.toLowerCase().includes(incSearch.toLowerCase()) ||
      (inc.assigneeName && inc.assigneeName.toLowerCase().includes(incSearch.toLowerCase()));
    const matchesStatus = incStatusFilter === 'ALL' || inc.status === incStatusFilter;
    const matchesPriority = incPriorityFilter === 'ALL' || inc.priority === incPriorityFilter;
    const matchesCategory = incCategoryFilter === 'ALL' || inc.category === incCategoryFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  // Filtered Users for Tab 2
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    const matchesStatus =
      userStatusFilter === 'ALL' ||
      (userStatusFilter === 'ACTIVE' && (u.status === 'ACTIVE' || !u.status)) ||
      (userStatusFilter === 'BLOCKED' && u.status === 'BLOCKED');

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Filtered Feedback for Tab 3
  const filteredFeedback = adminFeedbacks.filter((fb) => {
    if (fbRatingFilter === 'ALL') return true;
    return fb.rating === parseInt(fbRatingFilter, 10);
  });

  // Calculated Metrics
  const totalIncidentsCount = analytics?.kpis.totalIncidents ?? incidents.length;
  const openCount = analytics?.kpis.openIncidents ?? incidents.filter((i) => i.status === 'OPEN').length;
  const inProgressCount = analytics?.kpis.inProgressIncidents ?? incidents.filter((i) => i.status === 'IN_PROGRESS').length;
  const resolvedCount = analytics?.kpis.resolvedIncidents ?? incidents.filter((i) => i.status === 'RESOLVED').length;
  const activeUsersCount = analytics?.kpis.activeUsers ?? usersList.filter((u) => u.role === 'IT_USER').length;
  const activeEngineersCount = analytics?.kpis.activeEngineers ?? engineers.length;

  const openPercent = totalIncidentsCount > 0 ? Math.round((openCount / totalIncidentsCount) * 100) : 0;
  const inProgressPercent = totalIncidentsCount > 0 ? Math.round((inProgressCount / totalIncidentsCount) * 100) : 0;
  const resolvedPercent = totalIncidentsCount > 0 ? Math.round((resolvedCount / totalIncidentsCount) * 100) : 0;

  // Average Rating
  const avgRating = adminFeedbacks.length > 0
    ? (adminFeedbacks.reduce((acc, f) => acc + f.rating, 0) / adminFeedbacks.length).toFixed(1)
    : '0.0';

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono">
          Loading Operations Monitoring Dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* ADMIN DASHBOARD VIEW                                                      */}
      {/* ========================================================================= */}
      {isAdmin && (
        <>
          {/* Top Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                <Layers className="w-6 h-6 text-blue-600" />
                Operations Overview
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Welcome back, <strong className="text-slate-800 font-semibold">{currentUser?.name || 'Administrator'}</strong>. Real-time IT Incident Management & System Health.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Refresh Control */}
              <button
                onClick={fetchData}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title="Refresh Dashboard Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Feedback & Error Toast Banners */}
          {feedbackMessage && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 shadow-2xs ${
              feedbackMessage.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {feedbackMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span className="font-medium">{feedbackMessage.text}</span>
              </div>
              <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 6 KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
            {/* 1. Total Incidents */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">Total Incidents</span>
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono">{totalIncidentsCount}</div>
              <p className="text-[11px] text-slate-500">All registered records</p>
            </div>

            {/* 2. Open Incidents */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-amber-700">
                <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">Open</span>
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono">{openCount}</div>
              <p className="text-[11px] text-amber-700 font-medium">Awaiting acceptance</p>
            </div>

            {/* 3. In Progress Incidents */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-blue-700">
                <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">In Progress</span>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono">{inProgressCount}</div>
              <p className="text-[11px] text-blue-700 font-medium">Under investigation</p>
            </div>

            {/* 4. Resolved Incidents */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-emerald-700">
                <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">Resolved</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono">{resolvedCount}</div>
              <p className="text-[11px] text-emerald-700 font-medium">Verified closed</p>
            </div>

            {/* 5. Active IT Users */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">Active Users</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono">{activeUsersCount}</div>
              <p className="text-[11px] text-slate-500">IT Users</p>
            </div>

            {/* 6. Active Support Engineers */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-purple-700">
                <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">Engineers</span>
                <UserCheck className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono">{activeEngineersCount}</div>
              <p className="text-[11px] text-purple-700 font-medium">Active Support Staff</p>
            </div>
          </div>

          {/* Graphical Analytics & Workflow Pipeline Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 1. Incident Workflow Pipeline (Open -> In Progress -> Resolved) */}
            <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  Incident Operational Workflow
                </h3>
                <span className="text-[11px] font-mono text-slate-400">Live Stage Metrics</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono pt-1 text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                    <span>Open ({openCount} · {openPercent}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                    <span>In Progress ({inProgressCount} · {inProgressPercent}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    <span>Resolved ({resolvedCount} · {resolvedPercent}%)</span>
                  </div>
                </div>
              </div>

              {/* Workflow Flow Cards */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-center space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-amber-800">1. Open Stage</span>
                  <div className="text-xl font-bold text-amber-900 font-mono">{openCount}</div>
                  <p className="text-[10px] text-amber-700">Awaiting Acceptance</p>
                </div>
                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-center space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-blue-800">2. Investigation</span>
                  <div className="text-xl font-bold text-blue-900 font-mono">{inProgressCount}</div>
                  <p className="text-[10px] text-blue-700">Assigned & Active</p>
                </div>
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-center space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-800">3. Resolution</span>
                  <div className="text-xl font-bold text-emerald-900 font-mono">{resolvedCount}</div>
                  <p className="text-[10px] text-emerald-700">Verified Fixed</p>
                </div>
              </div>
            </div>

            {/* 2. Category Distribution */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-purple-600" />
                  Categories Breakdown
                </h3>
                <span className="text-[11px] font-mono text-slate-400">Database Counts</span>
              </div>

              <div className="space-y-2.5">
                {Object.entries(analytics?.categoryDistribution || { Network: 0, Server: 0, Software: 0, Hardware: 0, Other: 0 }).map(([cat, cnt]) => {
                  const pct = totalIncidentsCount > 0 ? Math.round((cnt / totalIncidentsCount) * 100) : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">{cat}</span>
                        <span className="font-mono text-slate-500">{cnt} tickets ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div style={{ width: `${pct}%` }} className="h-full bg-purple-600 rounded-full" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Engineer Workload Chart */}
          {analytics?.engineerWorkload && analytics.engineerWorkload.length > 0 && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Support Engineer Assigned Workload
                </h3>
                <span className="text-[11px] font-mono text-slate-400">Active Engineer Capacity</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.engineerWorkload.map((eng) => (
                  <div key={eng.id} className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{eng.fullName}</span>
                      <span className="text-[10px] font-mono text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                        {eng.totalAssigned} Active
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1 font-mono">
                      <div className="p-1.5 bg-amber-50 rounded-lg border border-amber-200/60">
                        <span className="block text-[10px] text-amber-700 font-sans">Open</span>
                        <span className="font-bold text-amber-900">{eng.openCount}</span>
                      </div>
                      <div className="p-1.5 bg-blue-50 rounded-lg border border-blue-200/60">
                        <span className="block text-[10px] text-blue-700 font-sans">In Progress</span>
                        <span className="font-bold text-blue-900">{eng.inProgressCount}</span>
                      </div>
                      <div className="p-1.5 bg-emerald-50 rounded-lg border border-emerald-200/60">
                        <span className="block text-[10px] text-emerald-700 font-sans">Resolved</span>
                        <span className="font-bold text-emerald-900">{eng.resolvedCount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Workspace Interactive Section Tabs */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            {/* Tab Header Bar */}
            <div className="border-b border-slate-200 bg-slate-50/60 px-4 pt-3 flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setAdminTab('INCIDENTS')}
                className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  adminTab === 'INCIDENTS'
                    ? 'border-blue-600 text-blue-600 bg-white shadow-2xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Incident Monitoring & Assignment</span>
                <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 rounded-full text-slate-600">
                  {incidents.length}
                </span>
              </button>

              <button
                onClick={() => setAdminTab('USERS')}
                className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  adminTab === 'USERS'
                    ? 'border-blue-600 text-blue-600 bg-white shadow-2xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>User & Engineer Management</span>
                <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 rounded-full text-slate-600">
                  {usersList.length}
                </span>
              </button>



              <button
                onClick={() => setAdminTab('AUDIT')}
                className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  adminTab === 'AUDIT'
                    ? 'border-blue-600 text-blue-600 bg-white shadow-2xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>System Audit Trail</span>
              </button>
            </div>

            {/* TAB CONTENT 1: INCIDENT MONITORING & ASSIGNMENT */}
            {adminTab === 'INCIDENTS' && (
              <div className="p-5 space-y-4">
                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={incSearch}
                      onChange={(e) => setIncSearch(e.target.value)}
                      placeholder="Filter by ticket number, title, reporter, or engineer..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={incStatusFilter}
                      onChange={(e) => setIncStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>

                    <select
                      value={incPriorityFilter}
                      onChange={(e) => setIncPriorityFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                    >
                      <option value="ALL">All Priorities</option>
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>

                    <select
                      value={incCategoryFilter}
                      onChange={(e) => setIncCategoryFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                    >
                      <option value="ALL">All Categories</option>
                      <option value="Network">Network</option>
                      <option value="Server">Server</option>
                      <option value="Software">Software</option>
                      <option value="Hardware">Hardware</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200">
                        <th className="p-3">Ticket ID</th>
                        <th className="p-3">Title & Category</th>
                        <th className="p-3">Priority</th>
                        <th className="p-3">Reporter</th>
                        <th className="p-3">Assigned Support Engineer</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Created</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredIncidents.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                            No incident records match the search filter.
                          </td>
                        </tr>
                      ) : (
                        filteredIncidents.map((inc) => (
                          <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 font-mono font-bold text-blue-600 whitespace-nowrap">
                              {inc.ticketNumber}
                            </td>
                            <td className="p-3 max-w-xs">
                              <div className="font-bold text-slate-900 truncate" title={inc.title}>
                                {inc.title}
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono">{inc.category}</span>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                inc.priority === 'Critical' ? 'bg-red-100 text-red-800 border border-red-200' :
                                inc.priority === 'High' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                inc.priority === 'Medium' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {inc.priority}
                              </span>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className="font-semibold text-slate-800">{inc.reporterName}</span>
                            </td>
                            <td className="p-3 whitespace-nowrap min-w-44">
                              {inc.status === 'RESOLVED' ? (
                                <span className="font-semibold text-slate-800 text-xs">
                                  {inc.assigneeName || 'Unassigned'}
                                </span>
                              ) : (
                                <select
                                  value={inc.assigneeId || 'UNASSIGNED'}
                                  onChange={(e) => handleAdminAssignIncident(inc.id, e.target.value)}
                                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="UNASSIGNED">-- Unassigned --</option>
                                  {engineers.map((eng) => (
                                    <option key={eng.id} value={eng.id}>
                                      {eng.fullName} ({eng.email})
                                    </option>
                                  ))}
                                </select>
                              )}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                inc.status === 'OPEN' ? 'bg-amber-100 text-amber-800' :
                                inc.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                'bg-emerald-100 text-emerald-800'
                              }`}>
                                {inc.status}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                              {new Date(inc.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-3 text-right whitespace-nowrap space-x-1">
                              <button
                                onClick={() => onNavigate(`incident-details?id=${inc.id}`)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                                title="Read-Only View"
                              >
                                View
                              </button>
                              <button
                                onClick={() => setDeleteConfirmIncident(inc)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Record"
                              >
                                <Trash2 className="w-3.5 h-3.5 inline-block" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: USER & SUPPORT ENGINEER DIRECTORY */}
            {adminTab === 'USERS' && (
              <div className="p-5 space-y-4">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search accounts by name or email..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                    >
                      <option value="ALL">All Roles</option>
                      <option value="IT_USER">IT Users</option>
                      <option value="SUPPORT_ENGINEER">Support Engineers</option>
                      <option value="ADMIN">Administrators</option>
                    </select>

                    <select
                      value={userStatusFilter}
                      onChange={(e) => setUserStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="ACTIVE">Active</option>
                      <option value="BLOCKED">Blocked</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200">
                        <th className="p-3">User Name & Email</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Account Status</th>
                        <th className="p-3">Incidents Reported / Assigned</th>
                        <th className="p-3">Registered</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                            No user accounts match the search filter.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => {
                          const isSelf = u.id === currentUser?.id;
                          const isBlocked = u.status === 'BLOCKED';
                          return (
                            <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3">
                                <div className="font-bold text-slate-900">{u.fullName} {isSelf && <span className="text-[10px] text-blue-600 font-mono">(You)</span>}</div>
                                <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                <span
                                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                    u.role === 'ADMIN'
                                      ? 'bg-purple-100 text-purple-800 border-purple-200'
                                      : u.role === 'SUPPORT_ENGINEER'
                                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                                      : 'bg-slate-100 text-slate-800 border-slate-200'
                                  }`}
                                >
                                  {u.role}
                                </span>
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isBlocked ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}>
                                  {isBlocked ? 'BLOCKED' : 'ACTIVE'}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                                Reported: {u.reportedCount || 0} · Assigned: {u.assignedCount || 0}
                              </td>
                              <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="p-3 text-right whitespace-nowrap space-x-1">
                                {!isSelf && (
                                  <>
                                    <button
                                      onClick={() => setUserActionTarget({ user: u, action: isBlocked ? 'UNBLOCK' : 'BLOCK' })}
                                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                                        isBlocked 
                                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                      }`}
                                    >
                                      {isBlocked ? 'Unblock' : 'Block'}
                                    </button>
                                    <button
                                      onClick={() => setUserActionTarget({ user: u, action: 'DELETE' })}
                                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                      title="Archive Account"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 inline-block" />
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}



            {/* TAB CONTENT 4: SYSTEM AUDIT TRAIL & ACTIVITY LOG */}
            {adminTab === 'AUDIT' && (
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Administrative & System Audit Log</h4>
                    <p className="text-[11px] text-slate-500">Real-time chronicle of operational events and status transitions.</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{auditLogs.length} events recorded</span>
                </div>

                <div className="space-y-3">
                  {auditLogs.length === 0 ? (
                    <p className="p-8 text-center text-xs text-slate-400">No activity logs recorded yet.</p>
                  ) : (
                    auditLogs.map((log) => (
                      <div key={log.id} className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl flex items-start justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{log.actorName}</span>
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.2 bg-slate-200 text-slate-700 rounded-full">
                              {log.actorRole.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.2 bg-blue-100 text-blue-800 rounded-full">
                              {log.eventType}
                            </span>
                          </div>
                          <p className="text-slate-700 leading-relaxed">{log.description}</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {new Date(log.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Delete Incident Modal */}
          {deleteConfirmIncident && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-red-100 text-red-700 rounded-xl shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Delete Incident Record?</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Are you sure you want to permanently delete ticket <strong>{deleteConfirmIncident.ticketNumber}</strong>? This action cannot be undone.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700">
                  <p className="font-bold text-slate-900">{deleteConfirmIncident.title}</p>
                  <p className="text-slate-500 mt-0.5">Reporter: {deleteConfirmIncident.reporterName}</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={deletingIncident}
                    onClick={() => setDeleteConfirmIncident(null)}
                    className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deletingIncident}
                    onClick={handleConfirmDeleteIncident}
                    className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    {deletingIncident ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* User Block / Delete Modal */}
          {userActionTarget && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Confirm Account {userActionTarget.action}?
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {userActionTarget.action === 'BLOCK' && `Blocking ${userActionTarget.user.fullName} will prevent them from logging in or making requests.`}
                      {userActionTarget.action === 'UNBLOCK' && `Unblocking ${userActionTarget.user.fullName} will restore their login access.`}
                      {userActionTarget.action === 'DELETE' && `Permanently deleting ${userActionTarget.user.fullName} will remove their account from Supabase Auth and the user directory while safely preserving operational incident history.`}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700">
                  <p className="font-bold text-slate-900">{userActionTarget.user.fullName}</p>
                  <p className="text-slate-500 mt-0.5">{userActionTarget.user.email} ({userActionTarget.user.role})</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={userActionLoading}
                    onClick={() => setUserActionTarget(null)}
                    className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={userActionLoading}
                    onClick={handleConfirmUserAction}
                    className={`px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-xs transition-colors cursor-pointer ${
                      userActionTarget.action === 'DELETE' || userActionTarget.action === 'BLOCK'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {userActionLoading ? 'Executing...' : `Confirm ${userActionTarget.action}`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* SUPPORT ENGINEER DASHBOARD VIEW                                           */}
      {/* ========================================================================= */}
      {isEngineer && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Support Workspace</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Welcome back, {currentUser?.name}. Manage ticket investigation and resolutions.
              </p>
            </div>
            <button
              onClick={() => onNavigate('all-incidents')}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Browse All Tickets
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-amber-700 uppercase font-mono">Available Open</span>
              <div className="text-2xl font-bold text-slate-900 font-mono">{summary?.availableOpenIncidents || 0}</div>
              <p className="text-[11px] text-slate-500">Unassigned tickets awaiting acceptance</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-blue-700 uppercase font-mono">Assigned to Me</span>
              <div className="text-2xl font-bold text-slate-900 font-mono">{summary?.assignedToMe || 0}</div>
              <p className="text-[11px] text-slate-500">Active investigation tickets</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase font-mono">My Resolved</span>
              <div className="text-2xl font-bold text-slate-900 font-mono">{summary?.resolvedIncidents || 0}</div>
              <p className="text-[11px] text-slate-500">Tickets you verified & closed</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Your Active Tickets</h3>
              <button
                onClick={() => onNavigate('my-assigned-incidents')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>See All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {incidents.filter((i) => i.assigneeId === currentUser?.id).length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">You currently have no assigned active tickets.</p>
              ) : (
                incidents
                  .filter((i) => i.assigneeId === currentUser?.id)
                  .slice(0, 3)
                  .map((i) => (
                    <div key={i.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-blue-600">{i.ticketNumber}</span> · <span className="font-semibold text-slate-900">{i.title}</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">Reporter: {i.reporterName} · Priority: {i.priority}</p>
                      </div>
                      <button
                        onClick={() => onNavigate(`incident-details?id=${i.id}`)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer shrink-0 ml-2"
                      >
                        Open Ticket
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* IT USER DASHBOARD VIEW                                                    */}
      {/* ========================================================================= */}
      {isITUser && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">IT Service Desk</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Welcome back, {currentUser?.name}. Submit technical requests and track resolution status.
              </p>
            </div>
            <button
              onClick={() => onNavigate('create-incident')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Incident</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-amber-700 uppercase font-mono">My Open Tickets</span>
              <div className="text-2xl font-bold text-slate-900 font-mono">{summary?.myOpenIncidents || 0}</div>
              <p className="text-[11px] text-slate-500">Awaiting support response</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-blue-700 uppercase font-mono">In Progress</span>
              <div className="text-2xl font-bold text-slate-900 font-mono">{summary?.inProgressIncidents || 0}</div>
              <p className="text-[11px] text-slate-500">Currently being investigated</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase font-mono">My Resolved</span>
              <div className="text-2xl font-bold text-slate-900 font-mono">{summary?.myResolvedIncidents || 0}</div>
              <p className="text-[11px] text-slate-500">Fixed & verified tickets</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Your Reported Incidents</h3>
            <div className="divide-y divide-slate-100">
              {incidents.filter((i) => i.reporterId === currentUser?.id).length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">You have not submitted any incidents yet.</p>
              ) : (
                incidents.filter((i) => i.reporterId === currentUser?.id).map((i) => (
                  <div key={i.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-blue-600">{i.ticketNumber}</span> · <span className="font-semibold text-slate-900">{i.title}</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">Assigned to: {i.assigneeName || 'Unassigned'} · Status: {i.status}</p>
                    </div>
                    <button
                      onClick={() => onNavigate(`incident-details?id=${i.id}`)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
