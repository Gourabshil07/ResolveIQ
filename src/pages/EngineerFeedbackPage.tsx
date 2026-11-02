import React, { useState, useEffect, useMemo } from 'react';
import { 
  Star, 
  Search, 
  Calendar, 
  CheckCircle2, 
  MessageSquare, 
  Filter, 
  RefreshCw,
  ExternalLink,
  ChevronRight,
  User,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { api, AdminFeedbackItem } from '../services/api';

interface EngineerFeedbackPageProps {
  onNavigate: (page: string) => void;
}

interface EngineerProfile {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export const EngineerFeedbackPage: React.FC<EngineerFeedbackPageProps> = ({ onNavigate }) => {
  const [feedbacks, setFeedbacks] = useState<AdminFeedbackItem[]>([]);
  const [engineers, setEngineers] = useState<EngineerProfile[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEngineerId, setSelectedEngineerId] = useState<string>('ALL');
  const [selectedRating, setSelectedRating] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'7d' | '30d' | '90d' | 'all'>('all');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fbData, engData, analyticsData] = await Promise.all([
        api.getAdminFeedbackList(),
        api.getEngineers(),
        api.getAdminAnalytics(),
      ]);
      setFeedbacks(fbData || []);
      setEngineers(engData || []);
      setAnalytics(analyticsData || null);
    } catch (err: any) {
      console.error('Failed to load engineer feedback data:', err);
      setError('Unable to load engineer feedback metrics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter feedbacks by date
  const dateFilteredFeedbacks = useMemo(() => {
    if (dateFilter === 'all') return feedbacks;
    const now = new Date().getTime();
    const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
    const maxMs = (daysMap[dateFilter] || 365) * 24 * 60 * 60 * 1000;

    return feedbacks.filter((fb) => {
      const createdTime = new Date(fb.createdAt).getTime();
      return now - createdTime <= maxMs;
    });
  }, [feedbacks, dateFilter]);

  // Compute per-engineer feedback performance metrics
  const engineerPerformance = useMemo(() => {
    // Collect all engineers (from engineers list or feedback records or analytics workload)
    const engMap = new Map<string, { id: string; fullName: string; email: string }>();

    engineers.forEach((e) => {
      engMap.set(e.id, { id: e.id, fullName: e.fullName, email: e.email });
    });

    if (analytics?.engineerWorkload) {
      analytics.engineerWorkload.forEach((w: any) => {
        if (!engMap.has(w.id)) {
          engMap.set(w.id, { id: w.id, fullName: w.fullName, email: w.email });
        }
      });
    }

    dateFilteredFeedbacks.forEach((fb) => {
      if (fb.resolvedByUserId && !engMap.has(fb.resolvedByUserId)) {
        engMap.set(fb.resolvedByUserId, {
          id: fb.resolvedByUserId,
          fullName: fb.resolvedByName || 'Support Engineer',
          email: 'engineer@resolveiq.internal',
        });
      }
    });

    return Array.from(engMap.values()).map((eng) => {
      // Find all feedbacks resolved by this specific engineer
      const engFeedbacks = dateFilteredFeedbacks.filter(
        (fb) => fb.resolvedByUserId === eng.id
      );

      const totalFeedbacks = engFeedbacks.length;
      const ratingSum = engFeedbacks.reduce((acc, fb) => acc + fb.rating, 0);
      const avgRating = totalFeedbacks > 0 ? ratingSum / totalFeedbacks : null;

      // Rating distribution
      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      engFeedbacks.forEach((fb) => {
        const r = Math.min(5, Math.max(1, Math.round(fb.rating))) as 1 | 2 | 3 | 4 | 5;
        distribution[r] = (distribution[r] || 0) + 1;
      });

      // Resolved count from workload analytics if available
      const workloadItem = analytics?.engineerWorkload?.find((w: any) => w.id === eng.id);
      const resolvedCount = workloadItem ? workloadItem.resolvedCount : engFeedbacks.length;

      return {
        id: eng.id,
        fullName: eng.fullName,
        email: eng.email,
        resolvedCount,
        totalFeedbacks,
        avgRating,
        distribution,
        feedbacks: engFeedbacks,
      };
    });
  }, [engineers, analytics, dateFilteredFeedbacks]);

  // Overall search and rating filtered feedback list for deep view
  const searchFilteredFeedbacks = useMemo(() => {
    return dateFilteredFeedbacks.filter((fb) => {
      // Engineer filter
      if (selectedEngineerId !== 'ALL' && fb.resolvedByUserId !== selectedEngineerId) {
        return false;
      }

      // Rating filter
      if (selectedRating !== 'ALL' && Math.round(fb.rating) !== parseInt(selectedRating, 10)) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTicket = fb.ticketNumber.toLowerCase().includes(q);
        const matchesTitle = fb.title.toLowerCase().includes(q);
        const matchesReporter = fb.reporterName.toLowerCase().includes(q);
        const matchesEngineer = (fb.resolvedByName || '').toLowerCase().includes(q);
        const matchesComment = (fb.comment || '').toLowerCase().includes(q);

        return matchesTicket || matchesTitle || matchesReporter || matchesEngineer || matchesComment;
      }

      return true;
    });
  }, [dateFilteredFeedbacks, selectedEngineerId, selectedRating, searchQuery]);

  const activeSelectedEngineer = useMemo(() => {
    if (selectedEngineerId === 'ALL') return null;
    return engineerPerformance.find((e) => e.id === selectedEngineerId) || null;
  }, [engineerPerformance, selectedEngineerId]);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500 shrink-0" />
            Engineer Performance & Feedback
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track Support Engineer customer satisfaction ratings, post-resolution reviews, and individual performance.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Control & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search engineer, ticket, comment..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Engineer Selector */}
          <div>
            <select
              value={selectedEngineerId}
              onChange={(e) => setSelectedEngineerId(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer"
            >
              <option value="ALL">All Support Engineers ({engineerPerformance.length})</option>
              {engineerPerformance.map((eng) => (
                <option key={eng.id} value={eng.id}>
                  {eng.fullName} ({eng.totalFeedbacks} {eng.totalFeedbacks === 1 ? 'review' : 'reviews'})
                </option>
              ))}
            </select>
          </div>

          {/* Star Rating Filter */}
          <div>
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer"
            >
              <option value="ALL">All Star Ratings</option>
              <option value="5">5 Stars (Excellent)</option>
              <option value="4">4 Stars (Good)</option>
              <option value="3">3 Stars (Average)</option>
              <option value="2">2 Stars (Below Average)</option>
              <option value="1">1 Star (Not Good)</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1.5 shrink-0" />
            <button
              onClick={() => setDateFilter('7d')}
              className={`flex-1 py-1 rounded-md text-center font-medium transition-colors cursor-pointer ${
                dateFilter === '7d' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDateFilter('30d')}
              className={`flex-1 py-1 rounded-md text-center font-medium transition-colors cursor-pointer ${
                dateFilter === '30d' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setDateFilter('90d')}
              className={`flex-1 py-1 rounded-md text-center font-medium transition-colors cursor-pointer ${
                dateFilter === '90d' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              90 Days
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`flex-1 py-1 rounded-md text-center font-medium transition-colors cursor-pointer ${
                dateFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}



      {/* Selected Engineer Feedback List Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>
                {activeSelectedEngineer
                  ? `Feedback Records for ${activeSelectedEngineer.fullName}`
                  : 'All Resolved Ticket Feedback Records'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 font-mono">
                {searchFilteredFeedbacks.length}
              </span>
            </h2>
            {activeSelectedEngineer && (
              <p className="text-xs text-slate-500 mt-0.5">
                Showing rating reviews specifically submitted for tickets resolved by {activeSelectedEngineer.fullName}.
              </p>
            )}
          </div>

          {selectedEngineerId !== 'ALL' && (
            <button
              onClick={() => setSelectedEngineerId('ALL')}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
            >
              Clear Engineer Filter
            </button>
          )}
        </div>

        {/* Feedback List Items */}
        {searchFilteredFeedbacks.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No feedback records found.</p>
            <p className="text-xs text-slate-500">
              {searchQuery || selectedEngineerId !== 'ALL' || selectedRating !== 'ALL'
                ? 'Try clearing your search query or filters.'
                : 'When IT Users submit post-resolution star ratings and comments, they will appear here.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {searchFilteredFeedbacks.map((fb) => {
              const ratingLabels: Record<number, string> = {
                5: 'Excellent',
                4: 'Good',
                3: 'Average',
                2: 'Below Average',
                1: 'Not Good',
              };

              return (
                <div key={fb.id} className="py-4 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Rating Badge */}
                      <div className="flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-md text-xs font-bold font-mono">
                        <span>{fb.rating}.0</span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= fb.rating
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-semibold text-amber-700 ml-1">
                          ({ratingLabels[fb.rating] || 'Rating'})
                        </span>
                      </div>

                      {/* Ticket Number Chip */}
                      <button
                        onClick={() => onNavigate(`incident-details?id=${fb.incidentId}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-mono font-semibold hover:bg-blue-100 transition-colors cursor-pointer"
                        title="View Read-Only Incident Details"
                      >
                        <span>{fb.ticketNumber}</span>
                        <ExternalLink className="w-3 h-3 text-blue-600" />
                      </button>

                      {/* Ticket Title */}
                      <span className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                        {fb.title}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono shrink-0">
                      {new Date(fb.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Feedback Details */}
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-xs space-y-1.5">
                    <p className="text-slate-800 font-medium leading-relaxed">
                      {fb.comment ? (
                        `"${fb.comment}"`
                      ) : (
                        <span className="italic text-slate-400">No written comment provided with this star rating.</span>
                      )}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                      <div>
                        <span className="font-semibold text-slate-700">Reporter:</span> {fb.reporterName}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Resolving Engineer:</span>{' '}
                        <span className="font-semibold text-blue-700">{fb.resolvedByName || 'Support Engineer'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
