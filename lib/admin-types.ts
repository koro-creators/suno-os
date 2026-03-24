import { SkillType, Moon } from './types';

export interface SkillVersion {
  version: number;
  date: string;
  author: string;
  summary: string;
}

export interface SkillAdmin {
  id: string;
  name: string;
  slug: string;
  type: SkillType;
  description: string;
  icon: string;
  status: 'active' | 'draft' | 'archived';
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  moons: Moon[];
  assignedClients: string[];
  versions: SkillVersion[];
  updatedAt: string;
  createdBy: string;
  averageScore: number;
  totalFeedbacks: number;
}
