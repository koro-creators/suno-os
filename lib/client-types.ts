export interface ClientMetrics {
  totalSessions: number;
  totalFeedbacks: number;
  averageScore: number;
  topSkill: string;
  lastActivity: string;
}

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
}
