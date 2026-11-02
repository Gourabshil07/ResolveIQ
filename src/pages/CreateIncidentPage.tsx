import React, { useState, useRef } from 'react';
import { Send, AlertCircle, ArrowLeft, Image as ImageIcon, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, IncidentCategory, IncidentPriority } from '../services/api';

interface CreateIncidentPageProps {
  onIncidentCreated: (newId: string) => void;
  onCancel: () => void;
}

export const CreateIncidentPage: React.FC<CreateIncidentPageProps> = ({
  onIncidentCreated,
  onCancel,
}) => {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IncidentCategory>('Network');
  const [priority, setPriority] = useState<IncidentPriority>('Medium');
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, WebP, GIF).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image attachment must be smaller than 10MB.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentUrl(reader.result as string);
      setAttachmentName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    setAttachmentUrl(null);
    setAttachmentName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Incident title is required.');
      return;
    }
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await api.createIncident({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        attachmentUrl,
        attachmentName,
      });
      onIncidentCreated(created.id);
    } catch (err: any) {
      setError(err.message || 'Failed to submit incident ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Create Incident</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit a new technical incident for support team triage and resolution.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      </div>

      {/* Main Intake Form */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        {error && (
          <div className="mb-5 flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Incident Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Incident Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cannot connect to staging database cluster"
              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                <option value="Network">Network</option>
                <option value="Server">Server</option>
                <option value="Software">Software</option>
                <option value="Hardware">Hardware</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as IncidentPriority)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed explanation of the problem, error messages, and steps to reproduce..."
              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
            />
          </div>

          {/* Optional Image Attachment */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Attachment (Optional Screenshot or Photo)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              id="incident-file-input"
            />
            {!attachmentUrl ? (
              <label
                htmlFor="incident-file-input"
                className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-xs text-slate-600 hover:bg-slate-100 hover:border-slate-400 transition-colors cursor-pointer w-full sm:w-auto inline-flex"
              >
                <ImageIcon className="w-4 h-4 text-slate-400" />
                <span>Upload an image / screenshot</span>
                <span className="text-[10px] text-slate-400 font-normal">(PNG, JPG, up to 10MB)</span>
              </label>
            ) : (
              <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg w-full max-w-md">
                <img
                  src={attachmentUrl}
                  alt={attachmentName || 'Attachment preview'}
                  className="w-12 h-12 rounded object-cover border border-slate-200 bg-white"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">{attachmentName || 'Attached image'}</p>
                  <p className="text-[10px] text-emerald-600 font-medium">Ready to upload</p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveAttachment}
                  className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-slate-200 transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Submit Action Bar */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Reporter: <span className="text-slate-700 font-semibold">{currentUser?.name}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Incident'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
