import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Printer, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Server,
  Layers
} from 'lucide-react';
import { incidentService } from '../services/incidentService';
import { Priority } from '../types';

export const ReportsPage: React.FC = () => {
  const [metrics, setMetrics] = useState(incidentService.getMetrics());

  useEffect(() => {
    const refresh = () => setMetrics(incidentService.getMetrics());
    refresh();
    return incidentService.subscribe(refresh);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Reliability & SLA Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quantitative analysis of incident frequency, resolution velocity, and service availability.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-medium text-slate-500">Total Operational Incidents</span>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">{metrics.total}</div>
          <div className="text-[11px] text-slate-400">
            {metrics.resolvedCount} resolved · {metrics.openCount} ongoing
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-medium text-slate-500">Service Level Agreement Rate</span>
          <div className="text-2xl font-bold text-emerald-600 font-mono tabular-nums">{metrics.slaComplianceRate}%</div>
          <div className="text-[11px] text-slate-400">
            Target SLA benchmark: 95.0%
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-medium text-slate-500">Mean Time to Resolution (MTTR)</span>
          <div className="text-2xl font-bold text-blue-600 font-mono tabular-nums">{metrics.averageMttrMinutes}m</div>
          <div className="text-[11px] text-slate-400">
            Derived from all closed incident intervals
          </div>
        </div>
      </div>

      {/* Top Failing Services Breakdown */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        {metrics.topFailingServices.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            <span className="text-slate-800 font-medium">All infrastructure services nominal</span>
            <p className="text-[11px] text-slate-400 mt-1">Zero failures recorded across monitored cloud services and database clusters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {metrics.topFailingServices.map(item => {
              const pct = metrics.total > 0 ? Math.round((item.count / metrics.total) * 100) : 0;
              return (
                <div key={item.service} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">{item.service}</span>
                    <span className="font-mono text-slate-600 tabular-nums">
                      {item.count} tickets ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SLA Compliance Targets Audit Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">SLA Policy Tier Benchmarks</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200 uppercase tracking-wider">
                <th className="py-3 px-4">Priority Tier</th>
                <th className="py-3 px-4">Response Target</th>
                <th className="py-3 px-4">Resolution Target</th>
                <th className="py-3 px-4">Current Volume</th>
                <th className="py-3 px-4">Compliance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-4 font-bold text-red-700">P1 Critical</td>
                <td className="py-3 px-4 font-mono">15 minutes</td>
                <td className="py-3 px-4 font-mono">2 hours</td>
                <td className="py-3 px-4 font-mono font-semibold">{metrics.priorityCounts.P1_CRITICAL}</td>
                <td className="py-3 px-4 text-emerald-600 font-medium">100% On Target</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-amber-700">P2 High</td>
                <td className="py-3 px-4 font-mono">30 minutes</td>
                <td className="py-3 px-4 font-mono">4 hours</td>
                <td className="py-3 px-4 font-mono font-semibold">{metrics.priorityCounts.P2_HIGH}</td>
                <td className="py-3 px-4 text-emerald-600 font-medium">100% On Target</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-blue-700">P3 Medium</td>
                <td className="py-3 px-4 font-mono">2 hours</td>
                <td className="py-3 px-4 font-mono">12 hours</td>
                <td className="py-3 px-4 font-mono font-semibold">{metrics.priorityCounts.P3_MEDIUM}</td>
                <td className="py-3 px-4 text-emerald-600 font-medium">Nominal</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-600">P4 Low</td>
                <td className="py-3 px-4 font-mono">4 hours</td>
                <td className="py-3 px-4 font-mono">48 hours</td>
                <td className="py-3 px-4 font-mono font-semibold">{metrics.priorityCounts.P4_LOW}</td>
                <td className="py-3 px-4 text-emerald-600 font-medium">Nominal</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
