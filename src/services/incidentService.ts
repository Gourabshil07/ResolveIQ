import { 
  DEFAULT_SETTINGS, 
  INITIAL_INCIDENTS, 
  INITIAL_NOTIFICATIONS, 
  MOCK_KNOWLEDGE_ARTICLES, 
  MOCK_SERVICES, 
  MOCK_USERS 
} from '../data/mockData';
import { 
  Category, 
  Incident, 
  IncidentFilterOptions, 
  KnowledgeArticle, 
  NotificationItem, 
  Priority, 
  Role, 
  SortField, 
  SortOrder, 
  Status, 
  SystemSettings, 
  TimelineEvent, 
  User 
} from '../types';

const STORAGE_KEY_INCIDENTS = 'resolveiq_incidents_clean_v2';
const STORAGE_KEY_USERS = 'resolveiq_users_clean_v2';
const STORAGE_KEY_NOTIFS = 'resolveiq_notifs_clean_v2';
const STORAGE_KEY_SETTINGS = 'resolveiq_settings_clean_v2';
const STORAGE_KEY_KB = 'resolveiq_kb_clean_v2';

class IncidentService {
  private incidents: Incident[] = [];
  private users: User[] = [];
  private notifications: NotificationItem[] = [];
  private settings: SystemSettings = DEFAULT_SETTINGS;
  private knowledgeArticles: KnowledgeArticle[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      // Clear legacy pre-seeded cache
      localStorage.removeItem('resolveiq_incidents_v1');
      localStorage.removeItem('resolveiq_notifs_v1');

      const storedIncidents = localStorage.getItem(STORAGE_KEY_INCIDENTS);
      this.incidents = storedIncidents ? JSON.parse(storedIncidents) : [];

      const storedUsers = localStorage.getItem(STORAGE_KEY_USERS);
      this.users = storedUsers ? JSON.parse(storedUsers) : [...MOCK_USERS];

      const storedNotifs = localStorage.getItem(STORAGE_KEY_NOTIFS);
      this.notifications = storedNotifs ? JSON.parse(storedNotifs) : [...INITIAL_NOTIFICATIONS];

      const storedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
      this.settings = storedSettings ? JSON.parse(storedSettings) : { ...DEFAULT_SETTINGS };

      const storedKb = localStorage.getItem(STORAGE_KEY_KB);
      this.knowledgeArticles = storedKb ? JSON.parse(storedKb) : [...MOCK_KNOWLEDGE_ARTICLES];
    } catch {
      this.incidents = [];
      this.users = [...MOCK_USERS];
      this.notifications = [...INITIAL_NOTIFICATIONS];
      this.settings = { ...DEFAULT_SETTINGS };
      this.knowledgeArticles = [...MOCK_KNOWLEDGE_ARTICLES];
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  private saveIncidents() {
    try {
      localStorage.setItem(STORAGE_KEY_INCIDENTS, JSON.stringify(this.incidents));
    } catch (e) {
      console.error('Failed to save incidents to localStorage', e);
    }
    this.notify();
  }

  private saveUsers() {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
    } catch (e) {
      console.error('Failed to save users to localStorage', e);
    }
    this.notify();
  }

  private saveNotifs() {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(this.notifications));
    } catch (e) {
      console.error('Failed to save notifications to localStorage', e);
    }
    this.notify();
  }

  private saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
    this.notify();
  }

  // --- Incidents ---
  public getIncidents(
    filters: IncidentFilterOptions = {},
    sortField: SortField = 'createdAt',
    sortOrder: SortOrder = 'desc',
    currentUser?: User
  ): Incident[] {
    let list = [...this.incidents];

    if (filters.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(inc => 
        inc.id.toLowerCase().includes(q) ||
        inc.title.toLowerCase().includes(q) ||
        inc.description.toLowerCase().includes(q) ||
        inc.service.toLowerCase().includes(q) ||
        inc.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    if (filters.status && filters.status !== 'ALL') {
      list = list.filter(inc => inc.status === filters.status);
    }

    if (filters.priority && filters.priority !== 'ALL') {
      list = list.filter(inc => inc.priority === filters.priority);
    }

    if (filters.category && filters.category !== 'ALL') {
      list = list.filter(inc => inc.category === filters.category);
    }

    if (filters.service && filters.service !== 'ALL') {
      list = list.filter(inc => inc.service === filters.service);
    }

    if (filters.assignedToMe && currentUser) {
      list = list.filter(inc => inc.assignee?.id === currentUser.id);
    }

    if (filters.reportedByMe && currentUser) {
      list = list.filter(inc => inc.reporter.id === currentUser.id);
    }

    list.sort((a, b) => {
      let valA: unknown = a[sortField];
      let valB: unknown = b[sortField];

      if (sortField === 'priority') {
        const priorityWeight: Record<Priority, number> = {
          P1_CRITICAL: 4,
          P2_HIGH: 3,
          P3_MEDIUM: 2,
          P4_LOW: 1
        };
        valA = priorityWeight[a.priority];
        valB = priorityWeight[b.priority];
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
    });

    return list;
  }

  public getIncidentById(id: string): Incident | undefined {
    return this.incidents.find(inc => inc.id === id);
  }

  public createIncident(payload: {
    title: string;
    description: string;
    category: Category;
    priority: Priority;
    service: string;
    reporter: User;
    symptoms?: string[];
    logsSnippet?: string;
    tags?: string[];
  }): Incident {
    const nextNum = 1045 + this.incidents.length;
    const newId = `INC-2026-${nextNum}`;
    const now = new Date().toISOString();

    // calculate SLA target based on priority
    const hours = this.settings.slaPolicies[payload.priority]?.resolveHours || 4;
    const slaTarget = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

    const newIncident: Incident = {
      id: newId,
      title: payload.title.trim(),
      description: payload.description.trim(),
      category: payload.category,
      priority: payload.priority,
      status: 'NEW',
      service: payload.service || 'Core Infrastructure',
      reporter: payload.reporter,
      createdAt: now,
      updatedAt: now,
      slaExpiresAt: slaTarget,
      symptoms: payload.symptoms || [],
      logsSnippet: payload.logsSnippet || '',
      tags: payload.tags || [payload.category.toLowerCase()],
      timeline: [
        {
          id: `tl_${Date.now()}`,
          incidentId: newId,
          author: payload.reporter,
          action: 'CREATED',
          note: `Incident opened: "${payload.title.trim()}"`,
          timestamp: now
        }
      ]
    };

    this.incidents = [newIncident, ...this.incidents];
    this.saveIncidents();

    // trigger notification for engineers
    this.addNotification({
      title: `New ${payload.priority.replace('_', ' ')} Incident: ${newId}`,
      message: `${payload.title} reported on ${payload.service}`,
      type: payload.priority === 'P1_CRITICAL' ? 'ALERT' : 'INFO',
      incidentId: newId
    });

    return newIncident;
  }

  public updateIncident(id: string, updates: Partial<Incident>, actor: User, actionNote?: string): Incident | undefined {
    const idx = this.incidents.findIndex(inc => inc.id === id);
    if (idx === -1) return undefined;

    const old = this.incidents[idx];
    const now = new Date().toISOString();

    const newTimeline = [...old.timeline];

    if (updates.status && updates.status !== old.status) {
      newTimeline.push({
        id: `tl_${Date.now()}_status`,
        incidentId: id,
        author: actor,
        action: 'STATUS_CHANGED',
        note: actionNote || `Status changed from ${old.status} to ${updates.status}`,
        timestamp: now
      });
      if (updates.status === 'RESOLVED') {
        updates.resolvedAt = now;
      }
    }

    if (updates.priority && updates.priority !== old.priority) {
      newTimeline.push({
        id: `tl_${Date.now()}_pri`,
        incidentId: id,
        author: actor,
        action: 'PRIORITY_CHANGED',
        note: actionNote || `Priority adjusted from ${old.priority} to ${updates.priority}`,
        timestamp: now
      });
    }

    if (updates.assignee && updates.assignee.id !== old.assignee?.id) {
      newTimeline.push({
        id: `tl_${Date.now()}_assign`,
        incidentId: id,
        author: actor,
        action: 'ASSIGNED',
        note: actionNote || `Assigned to ${updates.assignee.name} (${updates.assignee.role})`,
        timestamp: now
      });
    }

    const updated: Incident = {
      ...old,
      ...updates,
      updatedAt: now,
      timeline: newTimeline
    };

    this.incidents[idx] = updated;
    this.saveIncidents();
    return updated;
  }

  public addTimelineComment(incidentId: string, author: User, comment: string): boolean {
    const inc = this.getIncidentById(incidentId);
    if (!inc) return false;

    const now = new Date().toISOString();
    inc.timeline.push({
      id: `tl_comment_${Date.now()}`,
      incidentId,
      author,
      action: 'COMMENT_ADDED',
      note: comment.trim(),
      timestamp: now
    });
    inc.updatedAt = now;
    this.saveIncidents();
    return true;
  }

  public setAiDiagnosis(incidentId: string, diagnosis: Incident['aiDiagnosis'], actor: User) {
    const inc = this.getIncidentById(incidentId);
    if (!inc) return;

    inc.aiDiagnosis = diagnosis;
    inc.timeline.push({
      id: `tl_ai_${Date.now()}`,
      incidentId,
      author: actor,
      action: 'AI_DIAGNOSED',
      note: `AI diagnosis generated with ${Math.round((diagnosis?.confidenceScore || 0.9) * 100)}% confidence: ${diagnosis?.rootCauseHypothesis}`,
      timestamp: new Date().toISOString()
    });
    this.saveIncidents();
  }

  // --- Dynamic Metrics Calculation (No Hardcoded Numbers!) ---
  public getMetrics() {
    const now = Date.now();
    const total = this.incidents.length;
    const openIncidents = this.incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED');
    const criticalP1s = openIncidents.filter(i => i.priority === 'P1_CRITICAL');
    const highP2s = openIncidents.filter(i => i.priority === 'P2_HIGH');
    const resolved = this.incidents.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED');

    // SLA Breaches: open incidents whose slaExpiresAt is in the past
    const slaBreached = openIncidents.filter(i => new Date(i.slaExpiresAt).getTime() < now);

    // Calculate real Mean Time To Resolve (MTTR) in minutes from resolved incidents
    let totalResolutionMinutes = 0;
    let resolvedCountWithTimes = 0;
    resolved.forEach(i => {
      if (i.resolvedAt && i.createdAt) {
        const diffMs = new Date(i.resolvedAt).getTime() - new Date(i.createdAt).getTime();
        if (diffMs > 0) {
          totalResolutionMinutes += diffMs / (1000 * 60);
          resolvedCountWithTimes++;
        }
      }
    });

    const averageMttrMinutes = resolvedCountWithTimes > 0 
      ? Math.round(totalResolutionMinutes / resolvedCountWithTimes) 
      : 0;

    const slaComplianceRate = total > 0 
      ? Math.round(((total - slaBreached.length) / total) * 100) 
      : 100;

    // Service Breakdown
    const serviceCounts: Record<string, number> = {};
    this.incidents.forEach(i => {
      serviceCounts[i.service] = (serviceCounts[i.service] || 0) + 1;
    });

    const topFailingServices = Object.entries(serviceCounts)
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Priority Breakdown
    const priorityCounts: Record<Priority, number> = {
      P1_CRITICAL: this.incidents.filter(i => i.priority === 'P1_CRITICAL').length,
      P2_HIGH: this.incidents.filter(i => i.priority === 'P2_HIGH').length,
      P3_MEDIUM: this.incidents.filter(i => i.priority === 'P3_MEDIUM').length,
      P4_LOW: this.incidents.filter(i => i.priority === 'P4_LOW').length
    };

    return {
      total,
      openCount: openIncidents.length,
      criticalP1Count: criticalP1s.length,
      highP2Count: highP2s.length,
      resolvedCount: resolved.length,
      slaBreachedCount: slaBreached.length,
      slaComplianceRate,
      averageMttrMinutes,
      topFailingServices,
      priorityCounts
    };
  }

  // --- Users & Roles ---
  public getUsers(): User[] {
    return [...this.users];
  }

  public updateUserRole(userId: string, newRole: Role): boolean {
    const user = this.users.find(u => u.id === userId);
    if (!user) return false;
    user.role = newRole;
    this.saveUsers();
    return true;
  }

  public createUser(userData: Omit<User, 'id'>): User {
    const newUser: User = {
      ...userData,
      id: `usr_${Date.now()}`
    };
    this.users.push(newUser);
    this.saveUsers();
    return newUser;
  }

  // --- Knowledge Base ---
  public getKnowledgeArticles(search?: string, category?: string): KnowledgeArticle[] {
    let list = [...this.knowledgeArticles];
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      list = list.filter(kb => 
        kb.title.toLowerCase().includes(q) ||
        kb.summary.toLowerCase().includes(q) ||
        kb.content.toLowerCase().includes(q) ||
        kb.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (category && category !== 'ALL') {
      list = list.filter(kb => kb.category === category);
    }
    return list;
  }

  // --- Notifications ---
  public getNotifications(): NotificationItem[] {
    return [...this.notifications];
  }

  public addNotification(item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) {
    const newNotif: NotificationItem = {
      ...item,
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false
    };
    this.notifications = [newNotif, ...this.notifications];
    this.saveNotifs();
  }

  public markNotificationAsRead(id: string) {
    const n = this.notifications.find(item => item.id === id);
    if (n) {
      n.read = true;
      this.saveNotifs();
    }
  }

  public markAllNotificationsAsRead() {
    this.notifications.forEach(n => { n.read = true; });
    this.saveNotifs();
  }

  // --- System Settings ---
  public getSettings(): SystemSettings {
    return { ...this.settings };
  }

  public updateSettings(updates: Partial<SystemSettings>): SystemSettings {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
    return this.settings;
  }

  public resetToDefaults() {
    this.incidents = [...INITIAL_INCIDENTS];
    this.users = [...MOCK_USERS];
    this.notifications = [...INITIAL_NOTIFICATIONS];
    this.settings = { ...DEFAULT_SETTINGS };
    this.knowledgeArticles = [...MOCK_KNOWLEDGE_ARTICLES];
    this.saveIncidents();
    this.saveUsers();
    this.saveNotifs();
    this.saveSettings();
    try {
      localStorage.removeItem(STORAGE_KEY_INCIDENTS);
      localStorage.removeItem(STORAGE_KEY_USERS);
      localStorage.removeItem(STORAGE_KEY_NOTIFS);
      localStorage.removeItem(STORAGE_KEY_SETTINGS);
      localStorage.removeItem(STORAGE_KEY_KB);
    } catch {
      // ignore
    }
    this.notify();
  }

  public getAvailableServices(): string[] {
    return [...MOCK_SERVICES];
  }
}

export const incidentService = new IncidentService();
