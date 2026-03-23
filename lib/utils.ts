import { Client, Skill, Moon, SkillType } from '@/lib/types';
import { clients } from '@/data/clients';

export function getClientBySlug(slug: string): Client | undefined {
  return clients.find((c) => c.slug === slug);
}

export function getSkillBySlug(clientSlug: string, skillSlug: string): Skill | undefined {
  const client = getClientBySlug(clientSlug);
  return client?.skills.find((s) => s.slug === skillSlug);
}

export function getMoonBySlug(
  clientSlug: string,
  skillSlug: string,
  moonSlug: string,
): Moon | undefined {
  const skill = getSkillBySlug(clientSlug, skillSlug);
  return skill?.moons.find((m) => m.slug === moonSlug);
}

export function getSkillTypeColor(type: SkillType): string {
  switch (type) {
    case 'criacao':
      return 'var(--criacao)';
    case 'midia':
      return 'var(--midia)';
    case 'planejamento':
      return 'var(--planejamento)';
  }
}

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
