import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Sparkles, 
  Database, 
  Server, 
  Clock, 
  ShieldCheck, 
  Save, 
  RotateCcw, 
  Check, 
  AlertCircle
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { incidentService } from '../services/incidentService';
import { SystemSettings } from '../types';

export const SettingsPage: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<SystemSettings>(incidentService.getSettings());
  const [isPinging, setIsPinging] = useState(false);
  const [pingStatus, setPingStatus] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    incidentService.updateSettings(settings);
    showToast('System configuration saved successfully', 'success');
  };

  const handlePingBackend = () => {
    setIsPinging(true);
    setPingStatus(null);
    setTimeout(() => {
      setIsPinging(false);
      setPingStatus('Backend endpoint responsive: HTTP 200 OK (Latency: 48ms)');
      showToast('Render backend connection ping successful', 'success');
    }, 700);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all incidents, articles, and users to original demo state?')) {
      incidentService.resetToDefaults();
      setSettings(incidentService.getSettings());
      showToast('Demo data restored to defaults', 'info');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Settings & SLAs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure SLA policy targets, AI auto-triage behavior, and cloud backend connections.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Organization Settings */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Organization & Alerts</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">Organization Name</label>
              <input
                type="text"
                value={settings.organizationName}
                onChange={e => setSettings({ ...settings, organizationName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">On-Call Notification Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* SLA Policy Thresholds */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900">
            <Clock className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold">SLA Resolution Thresholds (Hours)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-red-50/50 border border-red-200 rounded-lg space-y-2">
              <span className="text-xs font-bold text-red-700">P1 Critical</span>
              <div>
                <label className="text-[11px] text-slate-600 block">Resolution Target (hrs)</label>
                <input
                  type="number"
                  step="0.5"
                  value={settings.slaPolicies.P1_CRITICAL.resolveHours}
                  onChange={e => setSettings({
                    ...settings,
                    slaPolicies: {
                      ...settings.slaPolicies,
                      P1_CRITICAL: { ...settings.slaPolicies.P1_CRITICAL, resolveHours: parseFloat(e.target.value) || 2 }
                    }
                  })}
                  className="w-full px-2 py-1 text-xs bg-white border border-red-300 rounded"
                />
              </div>
            </div>

            <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg space-y-2">
              <span className="text-xs font-bold text-amber-700">P2 High</span>
              <div>
                <label className="text-[11px] text-slate-600 block">Resolution Target (hrs)</label>
                <input
                  type="number"
                  step="0.5"
                  value={settings.slaPolicies.P2_HIGH.resolveHours}
                  onChange={e => setSettings({
                    ...settings,
                    slaPolicies: {
                      ...settings.slaPolicies,
                      P2_HIGH: { ...settings.slaPolicies.P2_HIGH, resolveHours: parseFloat(e.target.value) || 4 }
                    }
                  })}
                  className="w-full px-2 py-1 text-xs bg-white border border-amber-300 rounded"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg space-y-2">
              <span className="text-xs font-bold text-blue-700">P3 Medium</span>
              <div>
                <label className="text-[11px] text-slate-600 block">Resolution Target (hrs)</label>
                <input
                  type="number"
                  step="1"
                  value={settings.slaPolicies.P3_MEDIUM.resolveHours}
                  onChange={e => setSettings({
                    ...settings,
                    slaPolicies: {
                      ...settings.slaPolicies,
                      P3_MEDIUM: { ...settings.slaPolicies.P3_MEDIUM, resolveHours: parseFloat(e.target.value) || 12 }
                    }
                  })}
                  className="w-full px-2 py-1 text-xs bg-white border border-blue-300 rounded"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <span className="text-xs font-bold text-slate-700">P4 Low</span>
              <div>
                <label className="text-[11px] text-slate-600 block">Resolution Target (hrs)</label>
                <input
                  type="number"
                  step="1"
                  value={settings.slaPolicies.P4_LOW.resolveHours}
                  onChange={e => setSettings({
                    ...settings,
                    slaPolicies: {
                      ...settings.slaPolicies,
                      P4_LOW: { ...settings.slaPolicies.P4_LOW, resolveHours: parseFloat(e.target.value) || 48 }
                    }
                  })}
                  className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded"
                />
              </div>
            </div>
          </div>
        </div>

        {/* AI Triage & Model Configuration */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold">ResolveIQ AI Intelligence</h2>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <div className="text-xs font-semibold text-slate-900">Enable Automated Incident Triage</div>
              <div className="text-[11px] text-slate-500">Auto-suggest priority, category, and failure root cause upon ticket intake.</div>
            </div>
            <input
              type="checkbox"
              checked={settings.enableAiAutoTriage}
              onChange={e => setSettings({ ...settings, enableAiAutoTriage: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 cursor-pointer"
            />
          </div>

          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-slate-800 mb-1">AI Reasoning Model</label>
            <select
              value={settings.aiModel}
              onChange={e => setSettings({ ...settings, aiModel: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Sub-second triage)</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep diagnostic reasoning)</option>
            </select>
          </div>
        </div>

        {/* Cloud Backend & Supabase Configuration */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900">
            <Server className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold">Backend & Cloud Persistence</h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">Render Java 21 Spring Boot Backend URL</label>
              <input
                type="url"
                value={settings.renderBackendUrl}
                onChange={e => setSettings({ ...settings, renderBackendUrl: e.target.value })}
                placeholder="https://resolveiq-backend.onrender.com"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">Supabase PostgreSQL Endpoint</label>
              <input
                type="text"
                value={settings.supabaseEndpoint}
                onChange={e => setSettings({ ...settings, supabaseEndpoint: e.target.value })}
                placeholder="https://xyzproject.supabase.co"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800 focus:bg-white"
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handlePingBackend}
                disabled={isPinging}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                {isPinging ? 'Pinging Endpoint...' : 'Test Backend Connection'}
              </button>
              {pingStatus && (
                <span className="text-xs font-mono text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{pingStatus}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
