'use client';

import { useSkills } from '@/contexts/SkillsContext';
import { useAgents } from '@/contexts/AgentsContext';
import { Agent } from '@/lib/agents-types';

interface Props {
  agent: Agent;
}

export default function SkillsTab({ agent }: Props) {
  const { skills } = useSkills();
  const { toggleSkill } = useAgents();

  const activeSkills = skills.filter((s) => s.status === 'active');
  const assigned = agent.assigned_skills ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 600 }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
        Ative Skills ACTIVE para que o agente possa utilizá-las como ferramentas.
      </p>

      {activeSkills.length === 0 && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 16 }}>
          Nenhuma skill ativa encontrada.
        </p>
      )}

      {activeSkills.map((skill) => {
        const isOn = assigned.includes(skill.slug);
        return (
          <div
            key={skill.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              backgroundColor: 'var(--deep)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              transition: 'border-color 150ms ease',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {skill.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {skill.slug} · {skill.type}
              </div>
            </div>

            {/* Toggle */}
            <button
              type="button"
              role="switch"
              aria-checked={isOn}
              onClick={() => toggleSkill(agent.id, skill.slug)}
              style={{
                width: 40,
                height: 22,
                borderRadius: 9999,
                backgroundColor: isOn ? 'var(--sun)' : 'var(--nebula)',
                border: `1px solid ${isOn ? 'var(--sun)' : 'var(--border-subtle)'}`,
                cursor: 'pointer',
                position: 'relative',
                flexShrink: 0,
                transition: 'background-color 150ms ease, border-color 150ms ease',
                padding: 0,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: isOn ? 20 : 2,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: isOn ? 'var(--void)' : 'var(--text-muted)',
                  transition: 'left 150ms ease',
                }}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
