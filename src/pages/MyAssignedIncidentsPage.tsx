import React, { useState, useEffect, useMemo } from 'react';
import { Ticket, Search, Filter, RefreshCw, AlertCircle, ExternalLink, ChevronLeft, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, Incident } from '../services/api';

interface MyAssignedIncidentsPageProps {
  onNavigate: (page: string) => void;
}

export const MyAssignedIncidentsPage: React.FC<MyAssignedIncidentsPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  const fetchAssignedIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getIncidents();
      setIncidents(data || []);
    } catch (err: any) {
      console.error('Failed to load assigned incidents:', err);
      setError('Unable to load assigned incidents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedIncidents();
  }, []);

  // Filter for tickets assigned to currently logged-in Support Engineer
  const myAssignedIncidents = useMemo(() => {
    if (!currentUser) return [];
    return incidents.filter(
      (inc) => inc.assigneeId === currentUser.id || inc.resolvedById === currentUser.id
    );
  }, [incidents, currentUser]);

  // Apply Search, Status, and Priority filters
  const filteredIncidents = useMemo(() => {
    return myAssignedIncidents.filter((inc) => {
      // Status filter
      if (statusFilter !== 'ALL' && inc.status !== statusFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'ALL' && inc.priority !== priorityFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTicket = inc.ticketNumber.toLowerCase().includes(q);
        const matchesTitle = inc.title.toLowerCase().includes(q);
        const matchesCategory = inc.category.toLowerCase().includes(q);
        const matchesReporter = inc.reporterName.toLowerCase().includes(q);

        return matchesTicket || matchesTitle || matchesCategory || matchesReporter;
      }

      return true;
    });
  }, [myAssignedIncidents, statusFilter, priorityFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage) || 1;
  const paginatedIncidents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredIncidents.slice(start, start + itemsPerPage);
  }, [filteredIncidents, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Ticket className="w-6 h-6 text-blue-600 shrink-0" />
            My Assigned Incidents
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Technical support tickets currently assigned to you for investigation, troubleshooting, and resolution.
          </p>
        </div>

        <button
          onClick={fetchAssignedIncidents}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Tickets</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by ticket number, title, reporter, or category..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer"
          >
            <option value="ALL">All Statuses ({myAssignedIncidents.length})</option>
            <option value="IN_PROGRESS">In Progress ({myAssignedIncidents.filter((i) => i.status === 'IN_PROGRESS').length})</option>
            <option value="OPEN">Open ({myAssignedIncidents.filter((i) => i.status === 'OPEN').length})</option>
            <option value="RESOLVED">Resolved ({myAssignedIncidents.filter((i) => i.status === 'RESOLVED').length})</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Table of Assigned Incidents */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading assigned tickets...</div>
        ) : filteredIncidents.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Ticket className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No assigned tickets found.</p>
            <p className="text-xs text-slate-500">
              {searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                ? 'Try clearing search keywords or filters.'
                : 'When new tickets are accepted by or assigned to you, they will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold font-mono text-slate-500 border-b border-slate-200 uppercase tracking-wider">
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-4">Incident Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reporter</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedIncidents.map((inc) => {
                  const isResolved = inc.status === 'RESOLVED';
                  const isInProgress = inc.status === 'IN_PROGRESS';

                  const priorityColors: Record<string, string> = {
                    Critical: 'bg-red-100 text-red-800 border-red-200',
                    High: 'bg-orange-100 text-orange-800 border-orange-200',
                    Medium: 'bg-amber-100 text-amber-800 border-amber-200',
                    Low: 'bg-slate-100 text-slate-700 border-slate-200',
                  };

                  return (
                    <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                        {inc.ticketNumber}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs truncate">
                        {inc.title}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {inc.category}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            priorityColors[inc.priority] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {inc.priority}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full border ${
                            isResolved
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : isInProgress
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {isResolved ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          ) : isInProgress ? (
                            <Clock className="w-3 h-3 text-blue-600 shrink-0" />
                          ) : null}
                          <span>{inc.status.replace('_', ' ')}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                        <div className="font-semibold">{inc.reporterName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{inc.reporterEmail}</div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(inc.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onNavigate(`incident-details?id=${inc.id}`)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Open Ticket</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredIncidents.length > itemsPerPage && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing <span className="font-bold font-mono">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-bold font-mono">
                {Math.min(currentPage * itemsPerPage, filteredIncidents.length)}
              </span>{' '}
              of <span className="font-bold font-mono">{filteredIncidents.length}</span> assigned tickets
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
