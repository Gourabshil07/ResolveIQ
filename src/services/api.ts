// ResolveIQ API Client
// Connects to REST backend endpoints (/api/*)

export type UserRole = 'IT_USER' | 'SUPPORT_ENGINEER' | 'IT_SUPPORT' | 'ADMIN';
export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type IncidentCategory = 'Network' | 'Server' | 'Software' | 'Hardware' | 'Other';
export type IncidentPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status?: 'ACTIVE' | 'BLOCKED';
  isBlocked?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  reportedCount?: number;
  assignedCount?: number;
}

export interface Incident {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: IncidentCategory;
  priority: IncidentPriority;
  status: IncidentStatus;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  assigneeId?: string | null;
  assigneeName?: string | null;
  assigneeEmail?: string | null;
  resolutionNotes?: string | null;
  troubleshootingNotes?: string | null;
  assignmentSource?: 'ADMIN_ASSIGNED' | 'ENGINEER_ACCEPTED' | null;
  resolvedById?: string | null;
  resolvedByName?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
}

export interface IncidentMessage {
  id: string;
  incidentId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole | 'SYSTEM';
  content: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  messageType?: 'CHAT' | 'HANDOVER' | 'ACCEPTANCE' | 'SYSTEM' | null;
  createdAt: string;
}

export interface IncidentFeedback {
  id: string;
  incidentId: string;
  reporterId: string;
  resolvedByUserId?: string | null;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface IncidentUpdate {
  id: string;
  incidentId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  message: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  incidentId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

export interface AdminAnalytics {
  kpis: {
    totalIncidents: number;
    openIncidents: number;
    inProgressIncidents: number;
    resolvedIncidents: number;
    activeUsers: number;
    activeEngineers: number;
  };
  categoryDistribution: Record<string, number>;
  engineerWorkload: Array<{
    id: string;
    fullName: string;
    email: string;
    openCount: number;
    inProgressCount: number;
    resolvedCount: number;
    totalAssigned: number;
  }>;
  trends: Array<{
    date: string;
    created: number;
    resolved: number;
  }>;
}

export interface AdminFeedbackItem {
  id: string;
  incidentId: string;
  ticketNumber: string;
  title: string;
  reporterId: string;
  reporterName: string;
  resolvedByUserId?: string | null;
  resolvedByName?: string | null;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  actorName: string;
  actorRole: UserRole;
  eventType: string;
  description: string;
  ticketNumber?: string;
  createdAt: string;
}

export interface DashboardSummary {
  role: UserRole;
  userName: string;
  // IT User metrics
  openIncidents?: number;
  inProgressIncidents?: number;
  resolvedIncidents?: number;
  myOpenIncidents?: number;
  myResolvedIncidents?: number;
  totalMyIncidents?: number;
  // Support Engineer metrics
  availableOpenIncidents?: number;
  assignedToMe?: number;
  // Admin metrics
  totalIncidents?: number;
  totalUsers?: number;
}

const TOKEN_KEY = 'resolveiq_auth_token_v2';
const USER_KEY = 'resolveiq_auth_user_v2';

export const authStorage = {
  getToken: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken: (token: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.error('Failed to save token to localStorage', e);
    }
  },
  getUser: (): UserProfile | null => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },
  setUser: (user: UserProfile) => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save user to localStorage', e);
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error('Failed to clear auth storage', e);
    }
  },
};

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      ...options,
      headers,
    });
  } catch (networkError: any) {
    throw new Error(networkError.message || 'Network error: Failed to connect to server.');
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.toLowerCase().includes('application/json');

  if (!isJson) {
    const rawText = await response.text();
    const isHtml = rawText.trim().toLowerCase().startsWith('<!doctype') || rawText.trim().toLowerCase().startsWith('<html');
    if (isHtml) {
      if (!response.ok) {
        throw new Error(`Server returned error HTTP ${response.status} (HTML response).`);
      } else {
        throw new Error('Server returned an unexpected HTML page instead of JSON API response.');
      }
    }
    if (!response.ok) {
      throw new Error(rawText.slice(0, 150) || `Request failed with status ${response.status}`);
    }
    try {
      return JSON.parse(rawText) as T;
    } catch {
      throw new Error(`Unexpected non-JSON response from server (status ${response.status})`);
    }
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Failed to parse server response as JSON (status ${response.status})`);
  }

  if (!response.ok) {
    const errorMsg = data && (data.error || data.message)
      ? (data.error || data.message)
      : `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Authentication
  login: async (email: string, password: string): Promise<{ token: string; user: UserProfile }> => {
    const data = await apiFetch<{ token: string; user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    authStorage.setToken(data.token);
    authStorage.setUser(data.user);
    return data;
  },

  register: async (payload: {
    fullName: string;
    email: string;
    password: string;
    role: 'IT_USER' | 'SUPPORT_ENGINEER';
  }): Promise<{ token: string; user: UserProfile }> => {
    const data = await apiFetch<{ token: string; user: UserProfile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    authStorage.setToken(data.token);
    authStorage.setUser(data.user);
    return data;
  },

  getMe: async (): Promise<UserProfile> => {
    const user = await apiFetch<UserProfile>('/api/auth/me');
    authStorage.setUser(user);
    return user;
  },

  logout: async (): Promise<void> => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      authStorage.clear();
    }
  },

  // Incidents
  createIncident: async (payload: {
    title: string;
    description: string;
    category: IncidentCategory;
    priority: IncidentPriority;
    attachmentUrl?: string | null;
    attachmentName?: string | null;
  }): Promise<Incident> => {
    return apiFetch<Incident>('/api/incidents', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getIncidents: async (filters?: {
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
  }): Promise<Incident[]> => {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters?.priority && filters.priority !== 'ALL') params.append('priority', filters.priority);
    if (filters?.category && filters.category !== 'ALL') params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch<Incident[]>(`/api/incidents${query}`);
  },

  getIncidentById: async (id: string): Promise<Incident> => {
    return apiFetch<Incident>(`/api/incidents/${id}`);
  },

  updateStatus: async (
    id: string,
    status: IncidentStatus,
    resolutionNotes?: string
  ): Promise<Incident> => {
    return apiFetch<Incident>(`/api/incidents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, resolutionNotes }),
    });
  },

  assignIncident: async (id: string, assigneeId: string | null): Promise<Incident> => {
    return apiFetch<Incident>(`/api/incidents/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assigneeId }),
    });
  },

  acceptIncident: async (id: string): Promise<Incident> => {
    return apiFetch<Incident>(`/api/incidents/${id}/accept`, {
      method: 'PATCH',
    });
  },

  handoverIncident: async (id: string, handoverNote?: string): Promise<Incident> => {
    return apiFetch<Incident>(`/api/incidents/${id}/handover`, {
      method: 'PATCH',
      body: JSON.stringify({ handoverNote }),
    });
  },

  updateTroubleshooting: async (id: string, troubleshootingNotes: string): Promise<Incident> => {
    return apiFetch<Incident>(`/api/incidents/${id}/troubleshoot`, {
      method: 'PATCH',
      body: JSON.stringify({ troubleshootingNotes }),
    });
  },

  getAiTroubleshooting: async (id: string): Promise<{ configured?: boolean; suggestions?: string[]; suggestion: string }> => {
    return apiFetch<{ configured?: boolean; suggestions?: string[]; suggestion: string }>(`/api/incidents/${id}/ai-troubleshoot`, {
      method: 'POST',
    });
  },

  getIncidentUpdates: async (id: string): Promise<IncidentUpdate[]> => {
    return apiFetch<IncidentUpdate[]>(`/api/incidents/${id}/updates`);
  },

  sendIncidentUpdate: async (id: string, message: string): Promise<IncidentUpdate> => {
    return apiFetch<IncidentUpdate>(`/api/incidents/${id}/updates`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  getIncidentMessages: async (id: string): Promise<IncidentMessage[]> => {
    return apiFetch<IncidentMessage[]>(`/api/incidents/${id}/messages`);
  },

  sendIncidentMessage: async (
    id: string,
    payload: { content?: string; attachmentUrl?: string; attachmentName?: string }
  ): Promise<IncidentMessage> => {
    return apiFetch<IncidentMessage>(`/api/incidents/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  resolveIncident: async (id: string, resolutionSummary: string): Promise<Incident> => {
    return apiFetch<Incident>(`/api/incidents/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolutionSummary }),
    });
  },

  deleteIncident: async (id: string): Promise<{ message?: string; id?: string }> => {
    return apiFetch<{ message?: string; id?: string }>(`/api/incidents/${id}`, {
      method: 'DELETE',
    });
  },


  // Admin Features
  getAdminAnalytics: async (): Promise<AdminAnalytics> => {
    return apiFetch<AdminAnalytics>('/api/admin/analytics');
  },

  getAdminFeedbackList: async (): Promise<AdminFeedbackItem[]> => {
    return apiFetch<AdminFeedbackItem[]>('/api/admin/feedback');
  },

  getAdminAuditLogs: async (): Promise<AuditLogItem[]> => {
    return apiFetch<AuditLogItem[]>('/api/admin/audit-logs');
  },

  updateUserStatus: async (id: string, status: 'ACTIVE' | 'BLOCKED'): Promise<{ id: string; status: string; message: string }> => {
    return apiFetch<{ id: string; status: string; message: string }>(`/api/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  deleteUser: async (id: string): Promise<{ message: string; id: string }> => {
    return apiFetch<{ message: string; id: string }>(`/api/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Dashboard
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    return apiFetch<DashboardSummary>('/api/dashboard/summary');
  },

  // Users
  getUsers: async (): Promise<UserProfile[]> => {
    return apiFetch<UserProfile[]>('/api/users');
  },

  getEngineers: async (): Promise<Array<{ id: string; fullName: string; email: string; role: string }>> => {
    return apiFetch<Array<{ id: string; fullName: string; email: string; role: string }>>('/api/users/engineers');
  },

  updateUserRole: async (id: string, role: UserRole): Promise<UserProfile> => {
    return apiFetch<UserProfile>(`/api/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  setupAdmin: async (payload: {
    fullName: string;
    email: string;
    password: string;
    secret?: string;
  }): Promise<{ token: string; user: UserProfile; message?: string }> => {
    const headers: Record<string, string> = {};
    if (payload.secret) {
      headers['X-Admin-Setup-Secret'] = payload.secret;
    }
    const data = await apiFetch<{ token: string; user: UserProfile; message?: string }>('/api/auth/setup-admin', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    authStorage.setToken(data.token);
    authStorage.setUser(data.user);
    return data;
  },

  // Notifications
  getNotifications: async (): Promise<NotificationsResponse> => {
    return apiFetch<NotificationsResponse>('/api/notifications');
  },

  markNotificationRead: async (id: string): Promise<NotificationItem> => {
    return apiFetch<NotificationItem>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  markAllNotificationsRead: async (): Promise<{ message: string }> => {
    return apiFetch<{ message: string }>('/api/notifications/read-all', {
      method: 'PATCH',
    });
  },

  // Incident Feedback
  getIncidentFeedback: async (incidentId: string): Promise<IncidentFeedback | null> => {
    const data = await apiFetch<{ feedback: IncidentFeedback | null }>(`/api/incidents/${incidentId}/feedback`);
    return data.feedback;
  },

  submitIncidentFeedback: async (incidentId: string, rating: number, comment?: string): Promise<IncidentFeedback> => {
    return apiFetch<IncidentFeedback>(`/api/incidents/${incidentId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    });
  },

  // Contact Inquiries
  submitContactMessage: async (payload: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<{ success: boolean; message: string; inquiryId?: string }> => {
    return apiFetch<{ success: boolean; message: string; inquiryId?: string }>('/api/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

