import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  Send, 
  UserCheck, 
  ShieldAlert,
  MessageSquare,
  RotateCcw,
  Copy,
  Check,
  Image as ImageIcon,
  X,
  Maximize2,
  Lock,
  Paperclip,
  Star,
  ArrowRightLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, Incident, UserProfile, IncidentMessage, IncidentFeedback } from '../services/api';
import { useScrollLock } from '../hooks/useScrollLock';

interface IncidentDetailsPageProps {
  incidentId: string;
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

export const IncidentDetailsPage: React.FC<IncidentDetailsPageProps> = ({
  incidentId,
  onBack,
}) => {
  const { currentUser } = useAuth();
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  const [incident, setIncident] = useState<Incident | null>(null);
  const [engineers, setEngineers] = useState<UserProfile[]>([]);
  const [messages, setMessages] = useState<IncidentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Accepting ticket state
  const [accepting, setAccepting] = useState(false);

  // Section 2: AI Diagnosis & Tests state
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Section 3: Private Incident Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatAttachmentUrl, setChatAttachmentUrl] = useState<string | null>(null);
  const [chatAttachmentName, setChatAttachmentName] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatForbidden, setChatForbidden] = useState<string | null>(null);

  // Section 4: Resolution Confirmation Form state
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  // Post-Resolution Feedback state
  const [feedback, setFeedback] = useState<IncidentFeedback | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackHoverRating, setFeedbackHoverRating] = useState<number>(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Image modal state
  const [activeImageModal, setActiveImageModal] = useState<{ url: string; name?: string } | null>(null);

  // Handover state
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [handoverNote, setHandoverNote] = useState('');
  const [handoverLoading, setHandoverLoading] = useState(false);
  const [handoverError, setHandoverError] = useState<string | null>(null);

  const isITUser = currentUser?.role === 'IT_USER';
  const isAdmin = currentUser?.role === 'ADMIN';
  const isAssignedEngineer = currentUser?.role === 'SUPPORT_ENGINEER' && incident?.assigneeId === currentUser.id;
  const isResolvingEngineer = currentUser?.role === 'SUPPORT_ENGINEER' && incident?.resolvedById === currentUser.id;
  const isParticipant = currentUser && incident && (currentUser.id === incident.reporterId || currentUser.id === incident.assigneeId || (incident.status === 'RESOLVED' && currentUser.id === incident.resolvedById));
  const hasEngineerMessage = messages.some(m => m.senderRole === 'SUPPORT_ENGINEER');

  // Fetch messages helper
  const fetchMessages = useCallback(async () => {
    if (!incidentId) return;
    if (isAdmin) {
      setChatForbidden('Administrative Privacy Notice: Administrators cannot view or participate in private incident chats.');
      return;
    }
    try {
      const msgs = await api.getIncidentMessages(incidentId);
      setMessages(msgs);
      setChatForbidden(null);
    } catch (err: any) {
      setChatForbidden('Unable to load the conversation. Please try again.');
    }
  }, [incidentId, isAdmin]);

  const fetchIncidentAndDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const incidentData = await api.getIncidentById(incidentId);
      setIncident(incidentData);

      if (currentUser?.role === 'ADMIN') {
        const engList = await api.getEngineers();
        setEngineers(engList.filter(e => e.role === 'SUPPORT_ENGINEER') as UserProfile[]);
      } else {
        // Authorize chat fetching:
        // - Reporter: currentUser.id === incidentData.reporterId
        // - Assigned engineer: currentUser.id === incidentData.assigneeId
        // - Resolved incident & resolving engineer: incidentData.status === 'RESOLVED' && currentUser.id === incidentData.resolvedById
        const isAuthorizedToFetch =
          currentUser &&
          (currentUser.id === incidentData.reporterId ||
            (currentUser.role === 'SUPPORT_ENGINEER' &&
              (currentUser.id === incidentData.assigneeId ||
                (incidentData.status === 'RESOLVED' && currentUser.id === incidentData.resolvedById))));

        if (isAuthorizedToFetch) {
          await fetchMessages();
        } else {
          setMessages([]);
        }
      }

      // If incident is resolved, check for feedback
      if (incidentData.status === 'RESOLVED' && currentUser) {
        const canViewFeedback =
          currentUser.role === 'ADMIN' ||
          currentUser.id === incidentData.reporterId ||
          (currentUser.role === 'SUPPORT_ENGINEER' && currentUser.id === incidentData.resolvedById);

        if (canViewFeedback) {
          try {
            const fb = await api.getIncidentFeedback(incidentData.id);
            setFeedback(fb);
            if (!fb && currentUser.id === incidentData.reporterId) {
              setShowFeedbackForm(true);
            }
          } catch {
            // ignore
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Incident not found or unauthorized.');
    } finally {
      setLoading(false);
    }
  }, [incidentId, currentUser, fetchMessages]);

  useEffect(() => {
    fetchIncidentAndDetails();
  }, [fetchIncidentAndDetails]);

  // Periodic polling for chat messages if user is an active participant and incident is not resolved
  useEffect(() => {
    if (!incident || isAdmin || incident.status === 'RESOLVED') return;
    const isChatEligible = currentUser?.id === incident.reporterId || currentUser?.id === incident.assigneeId;
    if (!isChatEligible) return;

    const interval = setInterval(() => {
      fetchMessages();
    }, 3500);

    return () => clearInterval(interval);
  }, [incident, currentUser, isAdmin, fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Support Engineer self-acceptance
  const handleAcceptTicket = async () => {
    if (!incident) return;
    setAccepting(true);
    try {
      const updated = await api.acceptIncident(incident.id);
      setIncident(updated);
      setChatForbidden(null);
      await fetchMessages();
    } catch (err: any) {
      alert(err.message || 'Failed to accept incident.');
    } finally {
      setAccepting(false);
    }
  };

  // Support Engineer Handover
  const handleConfirmHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incident) return;

    setHandoverLoading(true);
    setHandoverError(null);
    try {
      const updated = await api.handoverIncident(incident.id, handoverNote.trim());
      setIncident(updated);
      setShowHandoverModal(false);
      setHandoverNote('');
      setMessages([]);
      setChatForbidden(null);
    } catch (err: any) {
      setHandoverError(err.message || 'Failed to handover incident.');
    } finally {
      setHandoverLoading(false);
    }
  };

  // Admin reassignment
  const handleAdminAssign = async (assigneeId: string) => {
    if (!incident) return;
    try {
      const updated = await api.assignIncident(
        incident.id, 
        assigneeId === 'UNASSIGNED' ? null : assigneeId
      );
      setIncident(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to assign incident.');
    }
  };

  // AI Suggestions Popup Modal State (Assigned Support Engineer only)
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiSuggestionText, setAiSuggestionText] = useState<string>('');
  const [isUsedInComposer, setIsUsedInComposer] = useState<boolean>(false);
  const [showDraftConflictModal, setShowDraftConflictModal] = useState(false);
  const aiModalBackdropRef = useRef<HTMLDivElement>(null);

  // Background scroll lock: locks document/body scrolling when modal is open, prevents layout shift
  const isAnyModalOpen = Boolean(showAiModal || showDraftConflictModal || showHandoverModal || activeImageModal);
  useScrollLock(isAnyModalOpen);

  // Close modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDraftConflictModal) {
          setShowDraftConflictModal(false);
        } else if (showAiModal) {
          setShowAiModal(false);
        } else if (activeImageModal) {
          setActiveImageModal(null);
        } else if (showHandoverModal && !handoverLoading) {
          setShowHandoverModal(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDraftConflictModal, showAiModal, activeImageModal, showHandoverModal, handoverLoading]);

  // Non-passive wheel & touch event listener to isolate scrolling to the modal content area
  useEffect(() => {
    if (!showAiModal) return;
    const el = aiModalBackdropRef.current;
    if (!el) return;

    const preventExtraneousScroll = (e: WheelEvent | TouchEvent) => {
      const scrollableEl = el.querySelector('.modal-scrollable-content');
      if (!scrollableEl || !scrollableEl.contains(e.target as Node)) {
        e.preventDefault();
      }
    };

    el.addEventListener('wheel', preventExtraneousScroll, { passive: false });
    el.addEventListener('touchmove', preventExtraneousScroll, { passive: false });

    return () => {
      el.removeEventListener('wheel', preventExtraneousScroll);
      el.removeEventListener('touchmove', preventExtraneousScroll);
    };
  }, [showAiModal]);

  const handleFetchAiTroubleshooting = async () => {
    if (!incident) return;
    setLoadingAi(true);
    setAiError(null);
    try {
      const res = await api.getAiTroubleshooting(incident.id);
      const messageText = res.suggestion || (res.suggestions && res.suggestions.join('\n\n')) || '';
      setAiSuggestionText(messageText);
      setIsUsedInComposer(false);
    } catch (err: any) {
      setAiError(err.message || 'AI Diagnostic Assistant is currently unavailable.');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleOpenAiModal = () => {
    setShowAiModal(true);
    if (!aiSuggestionText) {
      handleFetchAiTroubleshooting();
    }
  };

  const handleUseInChat = () => {
    if (chatInput.trim() !== '') {
      setShowDraftConflictModal(true);
    } else {
      applySuggestionToInput('replace');
    }
  };

  const applySuggestionToInput = (mode: 'append' | 'replace') => {
    if (mode === 'append') {
      setChatInput((prev) => (prev ? `${prev}\n\n${aiSuggestionText}` : aiSuggestionText));
    } else {
      setChatInput(aiSuggestionText);
    }
    setIsUsedInComposer(true);
  };

  const handleConfirmAppend = () => {
    applySuggestionToInput('append');
    setShowDraftConflictModal(false);
  };

  const handleConfirmReplace = () => {
    applySuggestionToInput('replace');
    setShowDraftConflictModal(false);
  };

  // Chat Attachment handler
  const handleChatFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setChatError('Only image files (PNG, JPG, WebP, GIF) are supported.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setChatError('Image attachment must be smaller than 10MB.');
      return;
    }

    setChatError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setChatAttachmentUrl(reader.result as string);
      setChatAttachmentName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveChatAttachment = () => {
    setChatAttachmentUrl(null);
    setChatAttachmentName(null);
    if (chatFileInputRef.current) {
      chatFileInputRef.current.value = '';
    }
  };

  // Send Chat Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incident) return;
    if (incident.status === 'RESOLVED') return;

    const trimmed = chatInput.trim();
    if (!trimmed && !chatAttachmentUrl) return;

    setSendingMessage(true);
    setChatError(null);
    try {
      const newMessage = await api.sendIncidentMessage(incident.id, {
        content: trimmed || undefined,
        attachmentUrl: chatAttachmentUrl || undefined,
        attachmentName: chatAttachmentName || undefined,
      });

      setMessages((prev) => [...prev, newMessage]);
      setChatInput('');
      setChatAttachmentUrl(null);
      setChatAttachmentName(null);
      if (chatFileInputRef.current) {
        chatFileInputRef.current.value = '';
      }
    } catch (err: any) {
      setChatError(err.message || 'Failed to send message.');
    } finally {
      setSendingMessage(false);
    }
  };

  // Confirm Resolution
  const handleConfirmResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incident) return;

    const trimmed = resolutionSummary.trim();
    if (!trimmed) {
      setResolveError('Resolution Summary is required. Please explain the cause, fix, and verification.');
      return;
    }

    setResolving(true);
    setResolveError(null);
    try {
      const updated = await api.resolveIncident(incident.id, trimmed);
      setIncident(updated);
      setShowResolveForm(false);
      setResolutionSummary('');
      fetchMessages();
    } catch (err: any) {
      setResolveError(err.message || 'Failed to resolve incident.');
    } finally {
      setResolving(false);
    }
  };

  // Submit Feedback Handler
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incident || !feedbackRating) return;
    setSubmittingFeedback(true);
    setFeedbackError(null);
    try {
      const submitted = await api.submitIncidentFeedback(incident.id, feedbackRating, feedbackComment);
      setFeedback(submitted);
      setShowFeedbackForm(false);
      setFeedbackSuccessMsg('Thank you! Your feedback has been submitted successfully.');
      setTimeout(() => setFeedbackSuccessMsg(null), 5000);
    } catch (err: any) {
      setFeedbackError(err.message || 'Failed to submit feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-sm text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
        Loading incident details...
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900">Incident Unavailable</h3>
        <p className="text-xs text-slate-600">{error || 'Incident details could not be loaded.'}</p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Incidents</span>
        </button>
      </div>
    );
  }

  const canWorkAndResolve = isAssignedEngineer;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {isAdmin && (
        <div className="p-3.5 bg-slate-900 text-white rounded-xl border border-slate-800 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wide text-blue-400 font-mono block">
                Read-Only Incident View
              </span>
              <span className="text-xs text-slate-300">
                As an Administrator, you are observing this record in read-only mode. Incident status and resolution details are managed strictly by the assigned Support Engineer.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-blue-600 px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
            {incident.ticketNumber}
          </span>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            incident.status === 'OPEN' ? 'bg-amber-100 text-amber-800' :
            incident.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
          }`}>
            {incident.status === 'OPEN' ? 'Open' : incident.status === 'IN_PROGRESS' ? 'In Progress' : 'Resolved'}
          </span>
        </div>
      </div>

      {/* Non-assigned Engineer Locked Queue Notice */}
      {currentUser?.role === 'SUPPORT_ENGINEER' && incident.assigneeId && incident.assigneeId !== currentUser.id && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            This incident is locked and assigned to <strong>{incident.assigneeName}</strong>. You are in read-only view.
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. REPORTED ISSUE (Read-Only Original Report & Image Attachment) */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">1</span>
              <span>Reported Issue</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Original incident report submitted by the user.</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Self-acceptance for unassigned OPEN incident */}
            {!isITUser && incident.status === 'OPEN' && !incident.assigneeId && currentUser?.role === 'SUPPORT_ENGINEER' && (
              <button
                onClick={handleAcceptTicket}
                disabled={accepting}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer transition-colors disabled:opacity-50"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{accepting ? 'Accepting...' : 'Accept Incident'}</span>
              </button>
            )}

            {/* Handover for assigned Support Engineer when IN_PROGRESS */}
            {incident.status === 'IN_PROGRESS' && isAssignedEngineer && (
              <button
                onClick={() => setShowHandoverModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg cursor-pointer transition-colors shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Handover Incident</span>
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-lg font-bold text-slate-900">{incident.title}</h1>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-lg text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Incident ID</span>
            <span className="font-mono font-bold text-blue-700">{incident.ticketNumber}</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Category</span>
            <span className="font-semibold text-slate-800">{incident.category}</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Priority</span>
            <span className={`font-semibold ${
              incident.priority === 'Critical' ? 'text-red-600' :
              incident.priority === 'High' ? 'text-orange-600' :
              incident.priority === 'Medium' ? 'text-slate-800' : 'text-slate-500'
            }`}>
              {incident.priority}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Reported By</span>
            <span className="font-medium text-slate-800 block truncate">{incident.reporterName}</span>
            <span className="text-[10px] text-slate-400 block truncate">{incident.reporterEmail}</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Assigned Engineer</span>
            {isAdmin && incident.status !== 'RESOLVED' ? (
              <div className="flex flex-col gap-1">
                <select
                  value={incident.assigneeId || 'UNASSIGNED'}
                  onChange={(e) => handleAdminAssign(e.target.value)}
                  className="text-xs py-1 px-1.5 border border-slate-300 rounded bg-white text-slate-800 font-medium"
                >
                  <option value="UNASSIGNED">Unassigned</option>
                  {engineers.map((eng) => (
                    <option key={eng.id} value={eng.id}>
                      {eng.fullName}
                    </option>
                  ))}
                </select>
                {incident.assignmentSource === 'ADMIN_ASSIGNED' && (
                  <span className="text-[10px] text-indigo-700 font-semibold">Assigned by Admin</span>
                )}
                {incident.assignmentSource === 'ENGINEER_ACCEPTED' && (
                  <span className="text-[10px] text-emerald-700 font-semibold">Accepted by Engineer</span>
                )}
              </div>
            ) : (
              <div>
                <span className="font-medium text-slate-800">
                  {incident.assigneeName || 'Unassigned'}
                </span>
                {incident.assignmentSource === 'ADMIN_ASSIGNED' && (
                  <span className="block text-[10px] text-indigo-700 font-semibold">Assigned by Admin</span>
                )}
                {incident.assignmentSource === 'ENGINEER_ACCEPTED' && (
                  <span className="block text-[10px] text-emerald-700 font-semibold">Accepted by Engineer</span>
                )}
              </div>
            )}
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Current Status</span>
            <span className={`inline-block font-semibold px-2 py-0.5 rounded text-[11px] ${
              incident.status === 'OPEN' ? 'bg-amber-100 text-amber-800' :
              incident.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {incident.status}
            </span>
          </div>

          <div className="col-span-2">
            <span className="text-slate-400 block mb-0.5">Created Date</span>
            <span className="font-mono text-slate-600 text-[11px]">
              {new Date(incident.createdAt).toLocaleDateString()} at {new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Read-Only Full Issue Description */}
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Original Issue Description</span>
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-lg text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-sans select-text">
            {incident.description}
          </div>
        </div>

        {/* Optional Image Attachment in Initial Report */}
        {incident.attachmentUrl && (
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Attachment</span>
            <div className="inline-block">
              <button
                type="button"
                onClick={() => setActiveImageModal({ url: incident.attachmentUrl!, name: incident.attachmentName || 'Incident Attachment' })}
                className="group relative flex items-center gap-3 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer text-left"
              >
                <img
                  src={incident.attachmentUrl}
                  alt={incident.attachmentName || 'Attachment'}
                  className="w-16 h-16 rounded object-cover border border-slate-200 bg-white"
                />
                <div className="pr-3">
                  <p className="text-xs font-semibold text-slate-800 truncate max-w-xs">{incident.attachmentName || 'Screenshot attachment'}</p>
                  <p className="text-[11px] text-blue-600 font-medium flex items-center gap-1 mt-0.5 group-hover:underline">
                    <Maximize2 className="w-3 h-3" />
                    <span>Click to view full image</span>
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 2. PRIVATE INCIDENT CHAT (Strict Auth: Reporter + Assigned Engineer Only) */}
      {/* ========================================================================= */}
      {!isAdmin && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                  2
                </span>
                <span>Private Incident Chat</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Direct, authenticated communication between the ticket reporter and the assigned Support Engineer.
              </p>
            </div>
            {incident.status === 'RESOLVED' && (
              <span className="text-[11px] font-medium text-slate-500 px-2 py-0.5 bg-slate-100 rounded flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Read-Only</span>
              </span>
            )}
          </div>

          {currentUser?.role === 'SUPPORT_ENGINEER' && (!incident.assigneeId || (incident.status === 'OPEN' && !incident.assigneeId)) ? (
          /* Case B: Support Engineer - Incident is OPEN and unassigned */
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Conversation Locked</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Accept this incident to unlock the private chat.
            </p>
          </div>
        ) : currentUser?.role === 'SUPPORT_ENGINEER' && incident.assigneeId && incident.assigneeId !== currentUser.id ? (
          /* Case C: Support Engineer - Incident is assigned to another engineer */
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Conversation Locked</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              This incident is assigned to {incident.assigneeName || 'another engineer'}. Only the assigned engineer can access this private chat.
            </p>
          </div>
        ) : isITUser && currentUser?.id !== incident.reporterId ? (
          /* Case D: IT User who did not report this incident */
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Conversation Locked</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Only the incident reporter and assigned engineer can access this private chat.
            </p>
          </div>
        ) : chatForbidden ? (
          /* Case E: Unexpected Error / Fallback */
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Conversation Locked</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              {chatForbidden}
            </p>
          </div>
        ) : isITUser && !hasEngineerMessage ? (
          /* Case F: Reporter before Support Engineer sends first message */
          <div className="p-6 bg-blue-50/70 border border-blue-200/80 rounded-xl text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Incident Received</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Your incident has been received. Chat will become available when your Support Engineer sends the first message.
            </p>
          </div>
        ) : (
          /* Case D: Active or Previously Activated Chat Thread */
          <div className="space-y-4">
            {/* Conversation Messages Container */}
            <div className="h-80 overflow-y-auto p-4 bg-slate-50/60 border border-slate-200 rounded-xl space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-400 space-y-1">
                  <MessageSquare className="w-7 h-7 text-slate-300 mb-1" />
                  <p className="font-semibold text-slate-600">No chat messages yet</p>
                  <p className="text-[11px] text-slate-400">
                    Send diagnostic findings or request details from the reporter.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isSystem =
                    msg.senderRole === 'SYSTEM' ||
                    msg.messageType === 'HANDOVER' ||
                    msg.messageType === 'ACCEPTANCE' ||
                    msg.messageType === 'SYSTEM';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="my-2.5 flex flex-col items-center">
                        <div className="max-w-[94%] sm:max-w-[85%] bg-slate-100/90 border border-slate-200 text-slate-700 rounded-lg px-3.5 py-2 text-xs flex items-start sm:items-center gap-2.5 shadow-2xs">
                          <ArrowRightLeft className="w-4 h-4 text-slate-500 shrink-0 mt-0.5 sm:mt-0" />
                          <div className="flex-1 leading-relaxed font-medium text-slate-800">
                            <span>{msg.content}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0 whitespace-nowrap ml-1">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  const isMe = msg.senderId === currentUser?.id;
                  const isEng = msg.senderRole === 'SUPPORT_ENGINEER';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[11px] font-bold text-slate-800">
                          {isMe ? 'You' : msg.senderName}
                        </span>
                        <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${
                          isEng ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {isEng ? 'Support Engineer' : 'Reporter'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs space-y-2 leading-relaxed ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-tr-xs'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                        }`}
                      >
                        {msg.content && (
                          <div className="whitespace-pre-wrap font-sans select-text">
                            {msg.content}
                          </div>
                        )}
                        {msg.attachmentUrl && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => setActiveImageModal({ url: msg.attachmentUrl!, name: msg.attachmentName || 'Image attachment' })}
                              className="group relative block rounded overflow-hidden border border-slate-200/50 bg-black/5 hover:opacity-90 transition-opacity cursor-pointer text-left"
                            >
                              <img
                                src={msg.attachmentUrl}
                                alt={msg.attachmentName || 'Attachment'}
                                className="max-h-48 rounded object-cover"
                              />
                              <div className={`p-1 text-[10px] truncate font-mono ${isMe ? 'text-blue-100' : 'text-slate-500'}`}>
                                {msg.attachmentName || 'Image Attachment'}
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Error banner if send failed */}
            {chatError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span className="flex-1">{chatError}</span>
                <button
                  type="button"
                  onClick={() => setChatError(null)}
                  className="text-red-500 hover:text-red-700 font-bold px-1 cursor-pointer"
                >
                  &times;
                </button>
              </div>
            )}

            {/* Read-Only State for Resolved Incidents or Handover State */}
            {incident.status === 'RESOLVED' ? (
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-center text-xs text-slate-600 flex items-center justify-center gap-2">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>This incident has been resolved. Chat is read-only.</span>
              </div>
            ) : !incident.assigneeId && isITUser ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center text-xs text-amber-800 flex items-center justify-center gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Support Engineer has released this incident for reassignment. A new Support Engineer needs to take ownership before the conversation continues.</span>
              </div>
            ) : (
              /* Chat Composer Form */
              <form id="chat-composer-form" onSubmit={handleSendMessage} className="space-y-2">
                {/* Image attachment preview chip */}
                {chatAttachmentUrl && (
                  <div className="flex items-center gap-2 p-2 bg-slate-100 border border-slate-200 rounded-lg w-fit max-w-sm">
                    <img
                      src={chatAttachmentUrl}
                      alt="Attachment preview"
                      className="w-8 h-8 rounded object-cover border border-slate-300 bg-white"
                    />
                    <span className="text-xs font-medium text-slate-800 truncate max-w-[180px]">
                      {chatAttachmentName || 'Attached image'}
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveChatAttachment}
                      className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-200 transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={chatFileInputRef}
                    onChange={handleChatFileChange}
                    accept="image/*"
                    className="hidden"
                    id="chat-file-input"
                  />
                  <label
                    htmlFor="chat-file-input"
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer transition-colors shrink-0"
                    title="Attach image"
                  >
                    <Paperclip className="w-4 h-4" />
                  </label>

                  {isAssignedEngineer && (
                    <button
                      type="button"
                      onClick={handleOpenAiModal}
                      disabled={loadingAi}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 rounded-lg cursor-pointer transition-colors shrink-0 flex items-center gap-1 text-xs font-semibold"
                      title="Open AI Troubleshooting Suggestions"
                    >
                      <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="hidden sm:inline">{loadingAi ? 'Analyzing...' : 'AI Suggestion'}</span>
                    </button>
                  )}

                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message to the other participant..."
                    className="flex-1 px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />

                  <button
                    type="submit"
                    disabled={sendingMessage || (!chatInput.trim() && !chatAttachmentUrl)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingMessage ? 'Sending...' : 'Send'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </section>
      )}

      {/* ========================================================================= */}
      {/* 3. RESOLVE INCIDENT (Simple, Safe Confirmation Workflow) */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                3
              </span>
              <span>Resolve Incident</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Confirm the issue is fixed and document the resolution.</p>
          </div>

          {incident.status === 'RESOLVED' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Resolved</span>
            </span>
          )}
        </div>

        {/* Incident is Already Resolved View */}
        {incident.status === 'RESOLVED' ? (
          <div className="p-5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2.5">
            <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Resolution Summary</span>
            </h3>
            <div className="p-4 bg-white border border-emerald-200 rounded-lg text-xs sm:text-sm text-emerald-950 whitespace-pre-wrap leading-relaxed font-sans shadow-2xs">
              {incident.resolutionNotes || 'Incident resolved and confirmed.'}
            </div>
            {incident.resolvedAt && (
              <div className="text-[11px] text-emerald-700 font-mono pt-1">
                Resolved on: {new Date(incident.resolvedAt).toLocaleString()} by {incident.resolvedByName || incident.assigneeName || 'Support Engineer'}
              </div>
            )}
          </div>
        ) : (
          /* Incident Not Yet Resolved */
          <div>
            {!showResolveForm ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200/80 rounded-lg">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-800">
                    Status: <span className="font-mono text-blue-600">{incident.status}</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {canWorkAndResolve
                      ? 'When all tests and checks confirm the issue is fixed, submit the resolution summary.'
                      : 'Under active investigation. Resolution can only be submitted by the assigned engineer or administrator.'}
                  </p>
                </div>

                {canWorkAndResolve && (
                  <button
                    type="button"
                    onClick={() => setShowResolveForm(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer transition-colors shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Resolve Incident</span>
                  </button>
                )}
              </div>
            ) : (
              /* Confirmation Form */
              <form onSubmit={handleConfirmResolution} className="p-5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-4 animate-in fade-in duration-150">
                <div>
                  <label htmlFor="resolution-summary" className="block text-xs font-bold text-slate-900 mb-1">
                    Resolution Summary <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-600 mb-2">
                    Describe the confirmed cause, fix, and verification result.
                  </p>
                  <textarea
                    id="resolution-summary"
                    required
                    rows={4}
                    value={resolutionSummary}
                    onChange={(e) => setResolutionSummary(e.target.value)}
                    placeholder="E.g., Root cause: Expired gateway certificate on US-East node. Fix: Re-issued 2048-bit RSA certificate and reloaded WireGuard daemon. Verification: Confirmed successful handshake and ping reachability from client workstation."
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                  />
                </div>

                {resolveError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{resolveError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-emerald-200/60">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResolveForm(false);
                      setResolveError(null);
                    }}
                    className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resolving || !resolutionSummary.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{resolving ? 'Confirming...' : 'Confirm Resolution'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 5. INCIDENT FEEDBACK (Optional Post-Resolution Satisfaction Rating) */}
      {/* ========================================================================= */}
      {incident.status === 'RESOLVED' && (
        (isITUser && currentUser?.id === incident.reporterId) ||
        (currentUser?.role === 'SUPPORT_ENGINEER' && currentUser?.id === incident.resolvedById) ||
        isAdmin
      ) && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Incident Feedback</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isITUser
                  ? 'Your rating and feedback help us improve technical support services.'
                  : 'Post-resolution satisfaction feedback provided by the incident reporter.'}
              </p>
            </div>

            {feedback && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Feedback Submitted</span>
              </span>
            )}
          </div>

          {feedbackSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{feedbackSuccessMsg}</span>
            </div>
          )}

          {feedback ? (
            /* Read-Only Feedback View */
            <div className="p-5 bg-slate-50 border border-slate-200/90 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= feedback.rating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    {feedback.rating === 1 && '1 star — Not Good'}
                    {feedback.rating === 2 && '2 stars — Below Average'}
                    {feedback.rating === 3 && '3 stars — Average'}
                    {feedback.rating === 4 && '4 stars — Good'}
                    {feedback.rating === 5 && '5 stars — Excellent'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Submitted {new Date(feedback.createdAt).toLocaleDateString()} at {new Date(feedback.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {feedback.comment ? (
                <div className="p-3.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                  {feedback.comment}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No additional comment provided.</p>
              )}
            </div>
          ) : isITUser && currentUser?.id === incident.reporterId ? (
            /* Reporter Has Not Submitted Feedback Yet */
            <div>
              {!showFeedbackForm ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200/80 rounded-lg">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-800">
                      How was your support experience?
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Feedback is completely optional and helps us improve our service.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFeedbackForm(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-xs shrink-0"
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>Give Feedback</span>
                  </button>
                </div>
              ) : (
                /* Interactive Feedback Form */
                <form onSubmit={handleSubmitFeedback} className="p-5 bg-amber-50/40 border border-amber-200/80 rounded-xl space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1.5">
                      Support Rating <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const activeRating = feedbackHoverRating || feedbackRating;
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setFeedbackRating(star)}
                              onMouseEnter={() => setFeedbackHoverRating(star)}
                              onMouseLeave={() => setFeedbackHoverRating(0)}
                              className="p-1 hover:scale-110 transition-transform cursor-pointer focus:outline-hidden"
                              title={`${star} stars`}
                            >
                              <Star
                                className={`w-6 h-6 transition-colors ${
                                  star <= activeRating
                                    ? 'text-amber-500 fill-amber-500'
                                    : 'text-slate-300 hover:text-amber-400'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-xs font-semibold text-slate-700">
                        {((feedbackHoverRating || feedbackRating) === 1) && '1 star — Not Good'}
                        {((feedbackHoverRating || feedbackRating) === 2) && '2 stars — Below Average'}
                        {((feedbackHoverRating || feedbackRating) === 3) && '3 stars — Average'}
                        {((feedbackHoverRating || feedbackRating) === 4) && '4 stars — Good'}
                        {((feedbackHoverRating || feedbackRating) === 5) && '5 stars — Excellent'}
                        {!feedbackHoverRating && !feedbackRating && (
                          <span className="text-slate-400 font-normal">Select a rating</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="feedback-comment" className="block text-xs font-bold text-slate-900 mb-1">
                      Describe your experience (optional)
                    </label>
                    <textarea
                      id="feedback-comment"
                      rows={3}
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="Tell us what went well or what could be improved..."
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    />
                  </div>

                  {feedbackError && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{feedbackError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-amber-200/60">
                    <button
                      type="button"
                      onClick={() => {
                        setShowFeedbackForm(false);
                        setFeedbackError(null);
                      }}
                      className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg cursor-pointer transition-colors"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={submittingFeedback || feedbackRating === 0}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <span>{submittingFeedback ? 'Submitting...' : 'Submit Feedback'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* For Resolving Engineer or Admin when no feedback submitted yet */
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 italic text-center">
              No feedback submitted by the reporter yet.
            </div>
          )}
        </section>
      )}

      {/* Image Modal Lightbox */}
      {activeImageModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setActiveImageModal(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800 text-slate-200 text-xs">
              <span className="font-medium truncate">{activeImageModal.name || 'Image Preview'}</span>
              <button
                type="button"
                onClick={() => setActiveImageModal(null)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 overflow-auto flex items-center justify-center bg-black/40">
              <img
                src={activeImageModal.url}
                alt={activeImageModal.name || 'Full preview'}
                className="max-h-[80vh] w-auto object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* Handover Modal */}
      {showHandoverModal && incident && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            if (!handoverLoading) {
              setShowHandoverModal(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-amber-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">Handover Incident</h3>
                <p className="text-xs font-mono text-amber-800 font-semibold">{incident.ticketNumber}</p>
              </div>
              <button
                type="button"
                disabled={handoverLoading}
                onClick={() => setShowHandoverModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {handoverError && (
              <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{handoverError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmHandover} className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Releasing <strong>{incident.ticketNumber}</strong> will clear your assignment and return the ticket status to <span className="font-semibold text-amber-700">OPEN</span> so another Support Engineer can claim it.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Handover Note <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  disabled={handoverLoading}
                  value={handoverNote}
                  onChange={(e) => setHandoverNote(e.target.value)}
                  placeholder="Explain why you are releasing this ticket (e.g., Escalating to Tier-2, Shift end, specialization needed)..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={handoverLoading}
                  onClick={() => setShowHandoverModal(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={handoverLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {handoverLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Confirm Handover</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Troubleshooting Suggestions Floating Popup Modal */}
      {showAiModal && (
        <div 
          ref={aiModalBackdropRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-suggestion-modal-title"
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAiModal(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-linear-to-r from-indigo-50/70 via-white to-purple-50/50 shrink-0 select-none">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="ai-suggestion-modal-title" className="text-base font-bold text-slate-900 flex items-center gap-2">
                    AI Troubleshooting Suggestion
                    <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200">
                      Private to Engineer
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ready-to-send response analyzed from incident report, attachments, and chat history
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Close suggestion"
                aria-label="Close suggestion modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Independently scrollable, stops scroll chaining to parent page */}
            <div 
              tabIndex={0}
              className="modal-scrollable-content p-5 overflow-y-auto flex-1 space-y-4 bg-slate-50/50 overscroll-contain focus:outline-hidden"
            >
              {loadingAi ? (
                <div className="py-12 text-center space-y-4">
                  <div className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-full text-indigo-600 animate-spin">
                    <RefreshCw className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Generating Ready-to-Send Message...</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      Analyzing ticket details, initial screenshots, and previous chat troubleshooting steps.
                    </p>
                  </div>
                </div>
              ) : aiError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3 text-xs">
                  <div className="flex items-start gap-2 text-red-700">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Failed to generate AI suggestion</p>
                      <p className="mt-0.5 text-red-600">{aiError}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleFetchAiTroubleshooting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>
                </div>
              ) : !aiSuggestionText ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No suggestion generated yet. Click Regenerate below to fetch a message draft.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-indigo-600" />
                      Suggested Message for Reporter (Read-Only Preview):
                    </span>
                    {isUsedInComposer ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Used in Composer
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleUseInChat}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-2xs transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Use in Chat</span>
                      </button>
                    )}
                  </div>

                  <div className={`p-4 rounded-xl border transition-all bg-white ${
                    isUsedInComposer 
                      ? 'border-emerald-300 ring-1 ring-emerald-200/50 shadow-xs' 
                      : 'border-slate-200 shadow-2xs'
                  }`}>
                    <div className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap select-text">
                      {aiSuggestionText}
                    </div>

                    {isUsedInComposer && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400 italic">
                          Inserted into your composer draft for review
                        </span>
                        <button
                          type="button"
                          onClick={handleUseInChat}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline cursor-pointer"
                        >
                          Insert Again
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between shrink-0 select-none">
              <button
                type="button"
                disabled={loadingAi}
                onClick={handleFetchAiTroubleshooting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAi ? 'animate-spin' : ''}`} />
                <span>{loadingAi ? 'Generating...' : 'Regenerate Message'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conflict Modal: Append vs Replace */}
      {showDraftConflictModal && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60] animate-in fade-in duration-150 overscroll-contain"
          onClick={() => {
            setShowDraftConflictModal(false);
          }}
        >
          <div 
            className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-5 overflow-hidden animate-in zoom-in-95 duration-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Composer Already Contains Text</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Your chat input box currently has unsent text. How would you like to add this AI suggestion?
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 max-h-24 overflow-y-auto">
              <span className="text-[10px] text-slate-400 font-sans block mb-1 uppercase tracking-wider font-bold">Current Draft:</span>
              {chatInput}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDraftConflictModal(false);
                }}
                className="w-full sm:w-auto px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReplace}
                className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer text-center"
              >
                Replace Draft
              </button>
              <button
                type="button"
                onClick={handleConfirmAppend}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer text-center"
              >
                Append to Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
