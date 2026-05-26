'use client';

import { useState } from 'react';
import { useAgents } from '@/contexts/AgentsContext';
import { Agent, AgentSchedule } from '@/lib/agents-types';

const DAYS = [
  { label: 'Dom', value: 0 },
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sáb', value: 6 },
];

const TIMEZONES = [
  'America/Sao_Paulo',
  'America/Manaus',
  'America/Belem',
  'America/Fortaleza',
  'UTC',
];

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  marginBottom: 6,
};

interface Props {
  agent: Agent;
}

export default function AgendamentoTab({ agent }: Props) {
  const { updateSchedule } = useAgents();
  const existing = agent.schedule ?? null;

  const [frequency, setFrequency] = useState<'hourly' | 'daily'>(
    existing?.frequency ?? 'daily',
  );
  const [days, setDays] = useState<number[]>(existing?.days_of_week ?? [1, 2, 3, 4, 5]);
  const [timeOfDay, setTimeOfDay] = useState(existing?.time_of_day ?? '09:00');
  const [minuteOffset, setMinuteOffset] = useState(existing?.minute_offset ?? 0);
  const [timezone, setTimezone] = useState(existing?.timezone ?? 'America/Sao_Paulo');
  const [enabled, setEnabled] = useState(existing?.enabled ?? false);
  const [saved, setSaved] = useState(false);

  function toggleDay(day: number) {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  }

  function handleSave() {
    const schedule: AgentSchedule = {
      id: existing?.id ?? crypto.randomUUID(),
      frequency,
      days_of_week: frequency === 'daily' ? days : null,
      time_of_day: frequency === 'daily' ? timeOfDay : null,
      minute_offset: frequency === 'hourly' ? minuteOffset : 0,
      timezone,
      enabled,
      last_run_at: existing?.last_run_at ?? null,
      next_run_at: null,
    };
    updateSchedule(agent.id, schedule);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 500 }}>
      {/* Frequency */}
      <div>
        <label style={labelStyle}>Frequência</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['hourly', 'daily'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFrequency(f)}
              style={{
                padding: '7px 16px',
                borderRadius: 9999,
                fontSize: '0.8rem',
                border: `1px solid ${frequency === f ? 'var(--sun)' : 'var(--border-subtle)'}`,
                backgroundColor: frequency === f ? 'rgba(255,200,1,0.12)' : 'var(--nebula)',
                color: frequency === f ? 'var(--sun)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                fontWeight: frequency === f ? 500 : 400,
              }}
            >
              {f === 'hourly' ? 'A cada hora' : 'Diário'}
            </button>
          ))}
        </div>
      </div>

      {/* Daily options */}
      {frequency === 'daily' && (
        <>
          <div>
            <label style={labelStyle}>Dias da semana</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DAYS.map((d) => {
                const isOn = days.includes(d.value);
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    style={{
                      width: 40,
                      height: 36,
                      borderRadius: 8,
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      border: `1px solid ${isOn ? 'var(--sun)' : 'var(--border-subtle)'}`,
                      backgroundColor: isOn ? 'rgba(255,200,1,0.12)' : 'var(--nebula)',
                      color: isOn ? 'var(--sun)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="sched-time" style={labelStyle}>
              Horário
            </label>
            <input
              id="sched-time"
              type="time"
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
              style={{
                backgroundColor: 'var(--nebula)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--sun)';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
        </>
      )}

      {/* Hourly options */}
      {frequency === 'hourly' && (
        <div>
          <label htmlFor="sched-minute" style={labelStyle}>
            Minuto (0–59)
          </label>
          <input
            id="sched-minute"
            type="number"
            min={0}
            max={59}
            value={minuteOffset}
            onChange={(e) => setMinuteOffset(Math.min(59, Math.max(0, Number(e.target.value))))}
            style={{
              width: 80,
              backgroundColor: 'var(--nebula)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '8px 10px',
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--sun)';
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
      )}

      {/* Timezone */}
      <div>
        <label htmlFor="sched-tz" style={labelStyle}>
          Fuso horário
        </label>
        <select
          id="sched-tz"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          style={{
            backgroundColor: 'var(--nebula)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '8px 10px',
            fontSize: '0.85rem',
            color: 'var(--text-primary)',
            outline: 'none',
            cursor: 'pointer',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--sun)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>

      {/* Enabled toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled((v) => !v)}
          style={{
            width: 40,
            height: 22,
            borderRadius: 9999,
            backgroundColor: enabled ? 'var(--sun)' : 'var(--nebula)',
            border: `1px solid ${enabled ? 'var(--sun)' : 'var(--border-subtle)'}`,
            cursor: 'pointer',
            position: 'relative',
            flexShrink: 0,
            transition: 'background-color 150ms ease',
            padding: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 2,
              left: enabled ? 20 : 2,
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: enabled ? 'var(--void)' : 'var(--text-muted)',
              transition: 'left 150ms ease',
            }}
          />
        </button>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Agendamento {enabled ? 'ativo' : 'desativado'}
        </span>
      </div>

      {/* Next run preview */}
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
        Próxima execução: —
      </p>

      {/* Save */}
      <button
        type="button"
        onClick={handleSave}
        style={{
          alignSelf: 'flex-start',
          backgroundColor: 'var(--sun)',
          color: 'var(--void)',
          border: 'none',
          borderRadius: 8,
          padding: '10px 20px',
          fontSize: '0.85rem',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'opacity 150ms ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
      >
        {saved ? 'Salvo ✓' : 'Salvar agendamento'}
      </button>
    </div>
  );
}
