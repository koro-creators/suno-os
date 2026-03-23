export type SkillType = 'criacao' | 'midia' | 'planejamento';

export interface Client {
  id: string;
  name: string;
  slug: string;
  color: string;
  skills: Skill[];
}

export interface Skill {
  id: string;
  name: string;
  slug: string;
  type: SkillType;
  moons: Moon[];
}

export interface Moon {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface BibliotecaItem {
  id: string;
  label: string;
  category: string;
  active: boolean;
}

export interface MockChatResponse {
  content: string;
  highlight?: { label: string; body: string };
  variants?: string[];
}

export interface PromptTemplate {
  id: string;
  label: string;
  prompt: string;
}
