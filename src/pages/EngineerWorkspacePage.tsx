import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  AlertOctagon, 
  PlayCircle, 
  CheckCircle2, 
  UserCheck, 
  Clock, 
  Wrench, 
  Sparkles,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { incidentService } from '../services/incidentService';
import { Incident } from '../types';
import { PriorityBadge, StatusBadge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';

interface EngineerWorkspacePageProps {
  onNavigate: (page: string) => void;
}

export const EngineerWorkspacePage: React.FC<EngineerWorkspacePageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [unassignedIncidents, setUnassignedIncidents] = useState<Incident[]>([]);
  const [activeIncidents, setActiveIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    const refresh = () => {
      const all = incidentService.getIncidents({}, 'priority', 'desc');
      setUnassignedIncidents(all.filter(i => !i.assignee && i.status !== 'RESOLVED' && i.status !== 'CLOSED'));
      setActiveIncidents(all.filter(i => i.assignee?.id === currentUser.id && i.status !== 'RESOLVED' && i.status !== 'CLOSED'));
    };

    refresh();
    return incidentService.subscribe(refresh);
  }, [currentUser]);

  if (!currentUser) {
    return <div className="p-8 text-center text-xs text-slate-500">Please sign in to access the engineer workbench.</div>;
  }

  const handleClaim = (inc: Incident) => {
    const updated = incidentService.updateIncident(
      inc.id,
      { assignee: currentUser, status: inc.status === 'NEW' ? 'TRIAGED' : inc.status },
      currentUser,
      `Engineer ${currentUser.name} claimed ticket and initiated triage`
    );
    if (updated) {
      showToast(`Claimed ${inc.id}. Opening War Room...`, 'success');
      onNavigate(`incident-details?id=${inc.id}`);
    }
  };

  const handleResolve = (incId: string) => {
    incidentService.updateIncident(
      incId,
      { status: 'RESOLVED' },
      currentUser,
      `Marked resolved by ${currentUser.name} from Engineer Workspace`
    );
    showToast(`Incident ${incId} marked resolved`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="p-5 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">Engineer Triage Workbench</h1>
            <p className="text-xs text-slate-400">
              Active incident response room for on-call engineers. Lead: <span className="text-blue-400 font-semibold">{currentUser.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>ON-CALL ROSTER ACTIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: My Active Assigned Tickets */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">My Active Incident Queue</h2>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {activeIncidents.length} active
            </span>
          </div>

          {activeIncidents.length === 0 ? (
            <div className="p-8 bg-white border border-slate-200 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
              <div className="text-xs font-semibold text-slate-800">Your assigned queue is clear!</div>
              <p className="text-[11px] text-slate-500">Pick up an unassigned ticket from the queue on the right.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeIncidents.map(inc => (
                <div 
                  key={inc.id}
                  className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-blue-400 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100">
                      {inc.id}
                    </span>
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={inc.priority} />
                      <StatusBadge status={inc.status} />
                    </div>
                  </div>

                  <div 
                    onClick={() => onNavigate(`incident-details?id=${inc.id}`)}
                    className="cursor-pointer group"
                  >
                    <h3 className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {inc.title}
                    </h3>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>{inc.service}</span>
                      <span>·</span>
                      <span>Due: {inc.slaExpiresAt ? new Date(inc.slaExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Standard'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onNavigate(`incident-details?id=${inc.id}`)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open War Room</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleResolve(inc.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer"
                    >
                      Resolve Ticket
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Unassigned Inbound Queue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">Unassigned Incoming Incidents</h2>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {unassignedIncidents.length} pending
            </span>
          </div>

          {unassignedIncidents.length === 0 ? (
            <div className="p-8 bg-white border border-slate-200 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-6 h-6 text-slate-400 mx-auto" />
              <div className="text-xs font-semibold text-slate-800">No unassigned tickets</div>
              <p className="text-[11px] text-slate-500">All current incidents are owned by team members.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {unassignedIncidents.map(inc => (
                <div 
                  key={inc.id}
                  className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-amber-400 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100">
                      {inc.id}
                    </span>
                    <PriorityBadge priority={inc.priority} />
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-slate-900">{inc.title}</h3>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>Reported by {inc.reporter?.name || 'User'}</span>
                      <span>·</span>
                      <span>{inc.service || 'IT'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onNavigate(`incident-details?id=${inc.id}`)}
                      className="text-xs text-slate-600 hover:text-slate-900"
                    >
                      Inspect Details
                    </button>

                    <button
                      onClick={() => handleClaim(inc)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Claim Incident</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
