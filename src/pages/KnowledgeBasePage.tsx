import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Tag, 
  Clock, 
  ChevronRight, 
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';
import { incidentService } from '../services/incidentService';
import { Category, KnowledgeArticle } from '../types';
import { CategoryBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';

export const KnowledgeBasePage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'ALL'>('ALL');
  const [activeArticle, setActiveArticle] = useState<KnowledgeArticle | null>(null);

  const articles = incidentService.getKnowledgeArticles(search, selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">IT Knowledge Base & Runbooks</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational triage playbooks, root-cause post-mortems, and standard operating procedures.
          </p>
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search runbooks by symptom, service, error message, or SQL query..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value as Category | 'ALL')}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white"
          >
            <option value="ALL">All Categories</option>
            <option value="DATABASE">DATABASE</option>
            <option value="AUTHENTICATION">AUTHENTICATION</option>
            <option value="CLOUD_INFRA">CLOUD_INFRA</option>
            <option value="SOFTWARE">SOFTWARE</option>
            <option value="NETWORK">NETWORK</option>
          </select>
        </div>
      </div>

      {/* Runbook Article Cards Grid */}
      {articles.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No runbooks found"
          description="No guides matched your current search criteria. Try searching for 'postgres', 'saml', or 'kubernetes'."
          actionLabel="Clear Search"
          onAction={() => { setSearch(''); setSelectedCategory('ALL'); }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {articles.map(article => (
            <div
              key={article.id}
              onClick={() => setActiveArticle(article)}
              className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-blue-500/50 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold text-slate-600">{article.id}</span>
                  <CategoryBadge category={article.category} />
                </div>

                <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                  {article.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {article.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{article.readTimeMinutes} min read</span>
                </div>
                <div className="flex items-center gap-1 text-blue-600 font-semibold">
                  <span>Read Runbook</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Article Detail Modal */}
      {activeArticle && (
        <Modal
          isOpen={!!activeArticle}
          onClose={() => setActiveArticle(null)}
          title={activeArticle.title}
          description={`${activeArticle.id} · ${activeArticle.service} · ${activeArticle.readTimeMinutes} min read`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs text-slate-700 leading-relaxed max-h-[70vh] overflow-y-auto pr-1">
            <div className="p-3 bg-blue-50 text-blue-900 rounded-lg border border-blue-200/60 font-medium">
              {activeArticle.summary}
            </div>

            <div className="prose prose-xs max-w-none text-slate-800 whitespace-pre-wrap font-sans">
              {activeArticle.content}
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700">Tags:</span>
                {activeArticle.tags.map(t => (
                  <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-slate-600">
                    #{t}
                  </span>
                ))}
              </div>
              <span>Used {activeArticle.usageCount} times in war rooms</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
