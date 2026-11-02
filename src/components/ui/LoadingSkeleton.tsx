import React from 'react';

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 animate-pulse">
      <div className="h-11 bg-slate-50 px-6 flex items-center gap-4">
        <div className="h-4 bg-slate-200 rounded w-24"></div>
        <div className="h-4 bg-slate-200 rounded w-48"></div>
        <div className="h-4 bg-slate-200 rounded w-28 ml-auto"></div>
        <div className="h-4 bg-slate-200 rounded w-20"></div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-6 py-4 flex items-center gap-4">
          <div className="h-4 bg-slate-200 rounded w-28"></div>
          <div className="space-y-1.5 flex-1">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-3 bg-slate-100 rounded w-1/2"></div>
          </div>
          <div className="h-6 bg-slate-100 rounded w-20"></div>
          <div className="h-6 bg-slate-100 rounded w-24"></div>
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="p-6 bg-white rounded-xl border border-slate-200 animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-slate-200 rounded w-28"></div>
        <div className="h-6 w-6 bg-slate-100 rounded"></div>
      </div>
      <div className="h-8 bg-slate-200 rounded w-16"></div>
      <div className="h-3 bg-slate-100 rounded w-36"></div>
    </div>
  );
};
