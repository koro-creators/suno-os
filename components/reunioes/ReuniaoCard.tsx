'use client';

import { useRouter } from 'next/navigation';
import { Calendar, ChevronRight, Time, Video } from '@carbon/icons-react';
import { Meeting, MeetingStatus } from '@/lib/meeting-types';

interface Props {
  meeting: Meeting;
}

const STATUS_LABELS: Record<MeetingStatus, string> = {
  pending_review: 'Aguardando Curadoria',
  curated: 'Curado',
  archived: 'Arquivado',
};

const STATUS_COLORS: Record<MeetingStatus, string> = {
  pending_review: '#FFC801',
  curated: '#4ade80',
  archived: 'var(--text-muted)',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ReuniaoCard({ meeting }: Props) {
  const router = useRouter();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/reunioes/${meeting.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(`/reunioes/${meeting.id}`);
        }
      }}
      style={{
        backgroundColor: 'var(--deep)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        padding: 20,
        cursor: 'pointer',
        transition: 'border-color 150ms ease, background-color 150ms ease',
        outline: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--twilight)';
        (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--nebula)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-subtle)';
        (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--deep)';
      }}
      onFocus={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
      }}
      onBlur={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: 'rgba(255,200,1,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Video size={14} style={{ color: 'var(--sun)' }} />
          </div>
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
              {meeting.title}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {meeting.client_id}
            </div>
          </div>
        </div>
        <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {formatDate(meeting.created_at)}
          </span>
        </div>
        {meeting.duration_minutes != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Time size={12} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {meeting.duration_minutes} min
            </span>
          </div>
        )}
      </div>

      {/* Status badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: '0.65rem',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: STATUS_COLORS[meeting.status],
            backgroundColor: `${STATUS_COLORS[meeting.status]}18`,
            padding: '3px 8px',
            borderRadius: 9999,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              backgroundColor: STATUS_COLORS[meeting.status],
              display: 'inline-block',
            }}
          />
          {STATUS_LABELS[meeting.status]}
        </span>
        {meeting.segments && (
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            {meeting.segments.filter((s) => s.selected).length}/{meeting.segments.length} trechos
          </span>
        )}
      </div>
    </div>
  );
}
