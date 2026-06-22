'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Agent,
  AgentCreate,
  AgentUpdate,
  AgentPermission,
  AgentAppConnection,
  MemoryFile,
  AgentSchedule,
  AgentRun,
  AgentRunResponse,
} from '@/lib/agents-types';
import { mockAgentRuns } from '@/data/agents-admin';
import {
  apiAvailable,
  listAgents,
  createAgentApi,
  updateAgentApi,
  archiveAgentApi,
} from '@/lib/api';

interface AgentsContextType {
  agents: Agent[];
  loading: boolean;
  createAgent: (data: AgentCreate) => Promise<Agent>;
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
  // Runs
  runAgent: (agentId: string, input: string, triggeredBy?: AgentRun['triggered_by']) => AgentRunResponse;
  listRuns: (agentId: string) => AgentRun[];
}

const AgentsContext = createContext<AgentsContextType | null>(null);

export function AgentsProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState<boolean>(apiAvailable());
  const [runs, setRuns] = useState<Record<string, AgentRun[]>>(() => ({ ...mockAgentRuns }));

  const SKILLS_KEY = 'sunos-agent-skills-v1';

  function loadStoredSkills(): Record<string, string[]> {
    try {
      return JSON.parse(localStorage.getItem(SKILLS_KEY) ?? '{}');
    } catch {
      return {};
    }
  }

  function saveStoredSkills(map: Record<string, string[]>) {
    localStorage.setItem(SKILLS_KEY, JSON.stringify(map));
  }

  useEffect(() => {
    if (!apiAvailable()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    listAgents().then((rows) => {
      if (!cancelled) {
        const stored = loadStoredSkills();
        setAgents(rows.map((a) => ({
          ...a,
          assigned_skills: stored[a.id] ?? [],
          skill_count: (stored[a.id] ?? []).length,
        })));
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const createAgent = async (data: AgentCreate): Promise<Agent> => {
    if (apiAvailable()) {
      const created = await createAgentApi(data);
      if (created) {
        setAgents((prev) => [created, ...prev]);
        return created;
      }
    }
    // mock-mode fallback
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
    if (apiAvailable()) void updateAgentApi(id, data);
  };

  const archiveAgent = (id: string) => {
    setAgents((prev) =>
      prev.map((a) => a.id === id ? { ...a, status: 'archived' as const, updated_at: new Date().toISOString() } : a),
    );
    if (apiAvailable()) void archiveAgentApi(id);
  };

  const toggleSkill = (agentId: string, skillSlug: string) => {
    setAgents((prev) => {
      const next = prev.map((a) => {
        if (a.id !== agentId) return a;
        const current = a.assigned_skills ?? [];
        const has = current.includes(skillSlug);
        const nextSkills = has ? current.filter((s) => s !== skillSlug) : [...current, skillSlug];
        return { ...a, assigned_skills: nextSkills, skill_count: nextSkills.length, updated_at: new Date().toISOString() };
      });
      // persist to localStorage
      const stored = loadStoredSkills();
      const agent = next.find((a) => a.id === agentId);
      if (agent) stored[agentId] = agent.assigned_skills ?? [];
      saveStoredSkills(stored);
      return next;
    });
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
        return { ...a, memory_files: [...(a.memory_files ?? []), file], updated_at: new Date().toISOString() };
      }),
    );
  };

  const removeMemoryFile = (agentId: string, fileId: string) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id !== agentId) return a;
        return { ...a, memory_files: (a.memory_files ?? []).filter((f) => f.id !== fileId), updated_at: new Date().toISOString() };
      }),
    );
  };

  const updateSchedule = (agentId: string, schedule: AgentSchedule | null) => {
    setAgents((prev) =>
      prev.map((a) => a.id === agentId ? { ...a, schedule, updated_at: new Date().toISOString() } : a),
    );
  };

  const addPermission = (agentId: string, permission: AgentPermission) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id !== agentId) return a;
        const permissions = [...(a.permissions ?? []), permission];
        return { ...a, permissions, client_count: permissions.length, updated_at: new Date().toISOString() };
      }),
    );
  };

  const removePermission = (agentId: string, clientId: string) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id !== agentId) return a;
        const permissions = (a.permissions ?? []).filter((p) => p.client_id !== clientId);
        return { ...a, permissions, client_count: permissions.length, updated_at: new Date().toISOString() };
      }),
    );
  };

  const runAgent = (
    agentId: string,
    input: string,
    triggeredBy: AgentRun['triggered_by'] = 'manual',
  ): AgentRunResponse => {
    const runId = crypto.randomUUID();
    const now = new Date().toISOString();
    const run: AgentRun = {
      id: runId,
      status: 'pending',
      triggered_by: triggeredBy,
      client_id: null,
      duration_ms: null,
      started_at: now,
      finished_at: null,
      input: { text: input },
      output: null,
      error_message: null,
    };

    setRuns((prev) => ({ ...prev, [agentId]: [run, ...(prev[agentId] ?? [])] }));

    setTimeout(() => {
      setRuns((prev) => ({
        ...prev,
        [agentId]: (prev[agentId] ?? []).map((r) =>
          r.id === runId ? { ...r, status: 'running' } : r,
        ),
      }));

      setTimeout(() => {
        const elapsed = Date.now() - new Date(now).getTime();
        setRuns((prev) => ({
          ...prev,
          [agentId]: (prev[agentId] ?? []).map((r) =>
            r.id === runId
              ? { ...r, status: 'completed', output: { text: `[Mock] Agente processou: "${input}"` }, duration_ms: elapsed, finished_at: new Date().toISOString() }
              : r,
          ),
        }));
      }, 2000);
    }, 500);

    return { run_id: runId };
  };

  const listRuns = (agentId: string): AgentRun[] => runs[agentId] ?? [];

  return (
    <AgentsContext.Provider
      value={{
        agents,
        loading,
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
        runAgent,
        listRuns,
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
