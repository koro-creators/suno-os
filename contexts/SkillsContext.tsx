'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { SkillAdmin } from '@/lib/admin-types';
import { initialSkills } from '@/data/skills-admin';

interface SkillsContextValue {
  skills: SkillAdmin[];
  updateSkill: (id: string, data: Partial<SkillAdmin>) => void;
  createSkill: (data: Omit<SkillAdmin, 'id'>) => SkillAdmin;
  deleteSkill: (id: string) => void;
}

const SkillsContext = createContext<SkillsContextValue | null>(null);

export function SkillsProvider({ children }: { children: ReactNode }) {
  const [skills, setSkills] = useState<SkillAdmin[]>(initialSkills);

  function updateSkill(id: string, data: Partial<SkillAdmin>) {
    setSkills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s))
    );
  }

  function createSkill(data: Omit<SkillAdmin, 'id'>): SkillAdmin {
    const id = `skill-${crypto.randomUUID()}`;
    const newSkill: SkillAdmin = { ...data, id };
    setSkills((prev) => [newSkill, ...prev]);
    return newSkill;
  }

  function deleteSkill(id: string) {
    setSkills((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <SkillsContext.Provider value={{ skills, updateSkill, createSkill, deleteSkill }}>
      {children}
    </SkillsContext.Provider>
  );
}

export function useSkills() {
  const ctx = useContext(SkillsContext);
  if (!ctx) throw new Error('useSkills must be used within SkillsProvider');
  return ctx;
}
