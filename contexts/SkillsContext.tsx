'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SkillAdmin } from '@/lib/admin-types';
import { initialSkills } from '@/data/skills-admin';
import {
  apiAvailable,
  listSkills,
  createSkillApi,
  updateSkillApi,
  deleteSkillApi,
} from '@/lib/api';

interface SkillsContextValue {
  skills: SkillAdmin[];
  updateSkill: (id: string, data: Partial<SkillAdmin>) => void;
  createSkill: (data: Omit<SkillAdmin, 'id'>) => Promise<SkillAdmin>;
  deleteSkill: (id: string) => void;
}

const SkillsContext = createContext<SkillsContextValue | null>(null);

export function SkillsProvider({ children }: { children: ReactNode }) {
  // Com API (prod): começa vazio e carrega do banco. Sem API (mock-mode dev): usa o seed local.
  const [skills, setSkills] = useState<SkillAdmin[]>(apiAvailable() ? [] : initialSkills);

  useEffect(() => {
    if (!apiAvailable()) return;
    listSkills().then((rows) => {
      if (rows) setSkills(rows);
    });
  }, []);

  async function createSkill(data: Omit<SkillAdmin, 'id'>): Promise<SkillAdmin> {
    if (apiAvailable()) {
      const created = await createSkillApi(data);
      if (created) {
        setSkills((prev) => [created, ...prev]);
        return created;
      }
    }
    // fallback local (mock-mode)
    const id = `skill-${crypto.randomUUID()}`;
    const newSkill: SkillAdmin = { ...data, id };
    setSkills((prev) => [newSkill, ...prev]);
    return newSkill;
  }

  function updateSkill(id: string, data: Partial<SkillAdmin>) {
    // otimista na UI; persiste em background quando há API
    setSkills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s))
    );
    if (apiAvailable()) void updateSkillApi(id, data);
  }

  function deleteSkill(id: string) {
    setSkills((prev) => prev.filter((s) => s.id !== id));
    if (apiAvailable()) void deleteSkillApi(id);
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
