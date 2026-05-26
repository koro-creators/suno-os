'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import {
  Agent,
  AgentCreate,
  AgentUpdate,
  AgentPermission,
  AgentAppConnection,
  MemoryFile,
  AgentSchedule,
} from '@/lib/agents-types';
import { mockAgents } from '@/data/agents-admin';

interface AgentsContextType {
  agents: Agent[];
  createAgent: (data: AgentCreate) => Agent;
  updateAgent: (id: string, data: AgentUpdate) => void;
  archiveAgent: (id: string) => void;
  // Skills
  toggleSkill: (agentId: string, skillSlug: string) => void;
  // Apps
  toggleApp: (agentId: string, appId: string, enabled: boolean) => void;
  // Memory files
  addMemoryFile: (agentId: string, file: MemoryFile) => void;
  removeMemoryFile: (agentId: string, fileId: string) => void;
  // Schedule
  updateSchedule: (agentId: string, schedule: AgentSchedule | null) => void;
  // Permissions
  addPermission: (agentId: string, permission: AgentPermission) => void;
  removePermission: (agentId: string, clientId: string) => void;
}

const AgentsContext = createContext<AgentsContextType | null>(null);

export function AgentsProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>(mockAgents);

  const createAgent = (data: AgentCreate): Agent => {
    const agent: Agent = {
      id: crypto.randomUUID(),
      name: data.name,
      icon: data.icon ?? '🤖',
      instructions: data.instructions,
      status: data.status ?? 'draft',
      skill_count: 0,
      client_count: 0,
      last_run_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      assigned_skills: [],
      apps: [],
      memory_files: [],
      schedule: null,
      permissions: [],
    };
    setAgents((prev) => [agent, ...prev]);
    return agent;
  };

  const updateAgent = (id: string, data: AgentUpdate) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, ...data, updated_at: new Date().toISOString() } : a,
      ),
    );
  };

  const archiveAgent = (id: string) => {
    updateAgent(id, { status: 'archived' });
  };

  const toggleSkill = (agentId: string, skillSlug: string) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id !== agentId) return a;
        const current = a.assigned_skills ?? [];
        const has = current.includes(skillSlug);
        const next = has ? current.filter((s) => s !== skillSlug) : [...current, skillSlug];
        return {
          ...a,
          assigned_skills: next,
          skill_count: next.length,
          updated_at: new Date().toISOString(),
        };
      }),
    );
  };

  const toggleApp = (agentId: string, appId: string, enabled: boolean) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id !== agentId) return a;
        const apps = (a.apps ?? []).map((app) =>
          app.id === appId ? { ...app, enabled } : app,
        );
        return { ...a, apps, updated_at: new Date().toISOString() };
      }),
    );
  };

  const addMemoryFile = (agentId: string, file: MemoryFile) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id !== agentId) return a;
        const files = [...(a.memory_files ?? []), file];
        return { ...a, memory_files: files, updated_at: new Date().toISOString() };
      }),
    );
  };

  const removeMemoryFile = (agentId: string, fileId: string) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id !== agentId) return a;
        const files = (a.memory_files ?? []).filter((f) => f.id !== fileId);
        return { ...a, memory_files: files, updated_at: new Date().toISOString() };
      }),
    );
  };

  const updateSchedule = (agentId: string, schedule: AgentSchedule | null) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === agentId
          ? { ...a, schedule, updated_at: new Date().toISOString() }
          : a,
      ),
    );
  };

  const addPermission = (agentId: string, permission: AgentPermission) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id !== agentId) return a;
        const permissions = [...(a.permissions ?? []), permission];
        return {
          ...a,
          permissions,
          client_count: permissions.length,
          updated_at: new Date().toISOString(),
        };
      }),
    );
  };

  const removePermission = (agentId: string, clientId: string) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id !== agentId) return a;
        const permissions = (a.permissions ?? []).filter((p) => p.client_id !== clientId);
        return {
          ...a,
          permissions,
          client_count: permissions.length,
          updated_at: new Date().toISOString(),
        };
      }),
    );
  };

  return (
    <AgentsContext.Provider
      value={{
        agents,
        createAgent,
        updateAgent,
        archiveAgent,
        toggleSkill,
        toggleApp,
        addMemoryFile,
        removeMemoryFile,
        updateSchedule,
        addPermission,
        removePermission,
      }}
    >
      {children}
    </AgentsContext.Provider>
  );
}

export function useAgents() {
  const ctx = useContext(AgentsContext);
  if (!ctx) throw new Error('useAgents must be used within AgentsProvider');
  return ctx;
}
