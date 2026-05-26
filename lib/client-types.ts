export interface ClientMetrics {
  totalSessions: number;
  totalFeedbacks: number;
  averageScore: number;
  topSkill: string;
  lastActivity: string;
}

/** Client lifecycle status. Existing clients default to ACTIVE. */
export type ClientAdminStatus = 'DRAFT' | 'PRE_ACTIVE' | 'ACTIVE' | 'ARCHIVED';

export interface ClientAdmin {
  id: string;
  name: string;
  slug: string;
  color: string;
  description: string;
  contact: string;
  assignedSkills: string[];
  metrics: ClientMetrics;
  createdAt: string;
  updatedAt: string;
  /** SPEC-015/SPEC-018: lifecycle status. Defaults to ACTIVE for existing clients. */
  status?: ClientAdminStatus;
}
