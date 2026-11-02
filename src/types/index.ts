export type Role = 'IT_USER' | 'SUPPORT_ENGINEER' | 'ADMIN' | 'EMPLOYEE' | 'ENGINEER' | 'IT_SUPPORT';

export type Priority = 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW';

export type Status = 'NEW' | 'TRIAGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'OPEN';

export type Category = 
  | 'DATABASE'
  | 'NETWORK'
  | 'AUTHENTICATION'
  | 'CLOUD_INFRA'
  | 'SOFTWARE'
  | 'HARDWARE'
  | 'SECURITY';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string;
  avatarUrl?: string;
  phone?: string;
  createdAt?: string;
}

export interface TimelineEvent {
  id: string;
  incidentId: string;
  author: {
    id: string;
    name: string;
    role: Role;
  };
  action: 'CREATED' | 'STATUS_CHANGED' | 'PRIORITY_CHANGED' | 'ASSIGNED' | 'COMMENT_ADDED' | 'AI_DIAGNOSED' | 'PLAYBOOK_EXECUTED';
  note: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AiDiagnosis {
  predictedCategory: Category;
  suggestedPriority: Priority;
  confidenceScore: number;
  rootCauseHypothesis: string;
  recommendedPlaybook: {
    title: string;
    steps: string[];
  };
  similarIncidentsCount: number;
  diagnosedAt: string;
}

export interface Incident {
  id: string;
  ticketNumber?: string;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  service: string;
  reporter: User;
  reporterId?: string;
  reporterName?: string;
  reporterEmail?: string;
  assignee?: User;
  assigneeId?: string | null;
  assigneeName?: string | null;
  assigneeEmail?: string | null;
  resolutionNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  slaExpiresAt: string;
  symptoms?: string[];
  logsSnippet?: string;
  tags: string[];
  aiDiagnosis?: AiDiagnosis;
  timeline: TimelineEvent[];
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: Category;
  service: string;
  summary: string;
  content: string;
  tags: string[];
  readTimeMinutes: number;
  lastUpdated: string;
  usageCount: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'ALERT' | 'ASSIGNMENT' | 'SLA_WARNING' | 'RESOLVED' | 'SYSTEM' | 'INFO';
  timestamp: string;
  read: boolean;
  incidentId?: string;
}

export interface SlaPolicy {
  priority: Priority;
  targetResponseHours: number;
  targetResolutionHours: number;
  description: string;
}

export interface SystemSettings {
  organizationName: string;
  supportEmail: string;
  enableAiAutoTriage: boolean;
  aiModel: string;
  renderBackendUrl: string;
  supabaseEndpoint: string;
  slaPolicies: Record<Priority, { responseHours: number; resolveHours: number }>;
}

export interface IncidentFilterOptions {
  search?: string;
  status?: Status | 'ALL';
  priority?: Priority | 'ALL';
  category?: Category | 'ALL';
  service?: string | 'ALL';
  assignedToMe?: boolean;
  reportedByMe?: boolean;
}

export type SortField = 'createdAt' | 'priority' | 'status' | 'slaExpiresAt' | 'title';
export type SortOrder = 'asc' | 'desc';
