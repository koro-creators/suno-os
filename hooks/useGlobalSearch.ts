'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/contexts/ClientsContext';
import { useSkills } from '@/contexts/SkillsContext';
import { useBiblioteca } from '@/contexts/BibliotecaContext';
import { SearchGroup, SearchResult } from '@/lib/search-types';

const MAX_PER_GROUP = 5;

function formatSkillType(type: string): string {
  const map: Record<string, string> = {
    criacao: 'Criação',
    midia: 'Mídia',
    planejamento: 'Planejamento',
  };
  return map[type] ?? type;
}

export function useGlobalSearch() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { clients } = useClients();
  const { skills } = useSkills();
  const { documents } = useBiblioteca();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce the query by 150ms
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 150);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  // Reset selectedIndex when debouncedQuery changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [debouncedQuery]);

  const groups: SearchGroup[] = (() => {
    const q = debouncedQuery.toLowerCase();
    if (q.length < 2) return [];

    const result: SearchGroup[] = [];

    // Clients group — visible to all roles
    const clientResults: SearchResult[] = clients
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q),
      )
      .slice(0, MAX_PER_GROUP)
      .map((c) => ({
        id: c.id,
        type: 'client' as const,
        label: c.name,
        href: isAdmin ? `/clientes/${c.id}` : `/${c.slug}`,
        color: c.color,
      }));

    if (clientResults.length > 0) {
      result.push({ type: 'client', label: 'Clientes', items: clientResults });
    }

    // Skills and Documents — admin only
    if (isAdmin) {
      const skillResults: SearchResult[] = skills
        .filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.slug.toLowerCase().includes(q),
        )
        .slice(0, MAX_PER_GROUP)
        .map((s) => ({
          id: s.id,
          type: 'skill' as const,
          label: s.name,
          sublabel: formatSkillType(s.type),
          href: `/skills/${s.id}`,
        }));

      if (skillResults.length > 0) {
        result.push({ type: 'skill', label: 'Skills', items: skillResults });
      }

      const docResults: SearchResult[] = documents
        .filter(
          (d) =>
            d.title.toLowerCase().includes(q) ||
            d.tags.some((t) => t.toLowerCase().includes(q)),
        )
        .slice(0, MAX_PER_GROUP)
        .map((d) => ({
          id: d.id,
          type: 'document' as const,
          label: d.title,
          href: `/biblioteca?q=${encodeURIComponent(d.title)}`,
        }));

      if (docResults.length > 0) {
        result.push({ type: 'document', label: 'Documentos', items: docResults });
      }
    }

    return result;
  })();

  const allItems: SearchResult[] = groups.flatMap((g) => g.items);

  const open = useCallback(() => {
    setIsOpen(true);
    setQuery('');
    setDebouncedQuery('');
    setSelectedIndex(0);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setDebouncedQuery('');
    setSelectedIndex(0);
  }, []);

  const navigateSelected = useCallback(() => {
    const item = allItems[selectedIndex];
    if (!item) return;
    close();
    router.push(item.href);
  }, [allItems, selectedIndex, close, router]);

  return {
    query,
    setQuery,
    groups,
    isOpen,
    open,
    close,
    selectedIndex,
    setSelectedIndex,
    navigateSelected,
    allItems,
  };
}
