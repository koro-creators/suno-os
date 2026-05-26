'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useClients } from '@/contexts/ClientsContext';
import { useSkills } from '@/contexts/SkillsContext';
import { RecentEntry } from '@/lib/types';

const STORAGE_KEY = 'sunos:recent';
const MAX_ENTRIES = 5;

const IGNORED_SLUGS = new Set([
  'skills',
  'clientes',
  'biblioteca',
  'workflows',
  'login',
  'design-system',
  '404',
]);

const CLIENT_REGEX = /^\/([a-z0-9-]+)$/;
const SKILL_REGEX = /^\/([a-z0-9-]+)\/([a-z0-9-]+)$/;

function readFromStorage(): RecentEntry[] {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as RecentEntry[];
  } catch {
    return [];
  }
}

function writeToStorage(entries: RecentEntry[]): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // sessionStorage unavailable — silently ignore
  }
}

function removeFromStorage(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // sessionStorage unavailable — silently ignore
  }
}

export function useNavigationHistory(): {
  recents: RecentEntry[];
  clear: () => void;
} {
  const pathname = usePathname();
  const { clients } = useClients();
  const { skills } = useSkills();

  const [recents, setRecents] = useState<RecentEntry[]>([]);

  // Hydrate from sessionStorage on mount (client-side only)
  useEffect(() => {
    setRecents(readFromStorage());
  }, []);

  // Record navigation on pathname change
  useEffect(() => {
    let entry: RecentEntry | null = null;

    const clientMatch = CLIENT_REGEX.exec(pathname);
    if (clientMatch) {
      const clientSlug = clientMatch[1];
      if (!IGNORED_SLUGS.has(clientSlug)) {
        const client = clients.find((c) => c.slug === clientSlug);
        entry = {
          label: client ? client.name : clientSlug,
          href: pathname,
          color: client ? client.color : '#6B7280',
          type: 'client',
          visitedAt: Date.now(),
        };
      }
    }

    const skillMatch = !entry ? SKILL_REGEX.exec(pathname) : null;
    if (skillMatch) {
      const clientSlug = skillMatch[1];
      const skillSlug = skillMatch[2];
      if (!IGNORED_SLUGS.has(clientSlug) && !IGNORED_SLUGS.has(skillSlug)) {
        const client = clients.find((c) => c.slug === clientSlug);
        const skill = skills.find((s) => s.slug === skillSlug);
        const clientName = client ? client.name : clientSlug;
        const skillName = skill ? skill.name : skillSlug;
        entry = {
          label: `${clientName} · ${skillName}`,
          href: pathname,
          color: client ? client.color : '#6B7280',
          type: 'skill',
          visitedAt: Date.now(),
        };
      }
    }

    if (!entry) return;

    const newEntry = entry;
    setRecents((prev) => {
      // Remove any existing entry with the same href (dedup), then prepend
      const filtered = prev.filter((r) => r.href !== newEntry.href);
      const updated = [newEntry, ...filtered].slice(0, MAX_ENTRIES);
      writeToStorage(updated);
      return updated;
    });
  }, [pathname, clients, skills]);

  const clear = () => {
    setRecents([]);
    removeFromStorage();
  };

  return { recents, clear };
}
