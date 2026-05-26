'use client';

import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Meeting, MeetingSegment } from '@/lib/meeting-types';
import TrechoCard from './TrechoCard';

interface Props {
  meeting: Meeting;
  segments: MeetingSegment[];
  onSegmentToggle: (id: string, selected: boolean) => void;
  onContextChange: (id: string, note: string) => void;
}

export default function TranscricaoPanel({ meeting, segments, onSegmentToggle, onContextChange }: Props) {
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);

  const selectedCount = segments.filter((s) => s.selected).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Full transcript — collapsible */}
      <div
        style={{
          backgroundColor: 'var(--deep)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <button
          onClick={() => setTranscriptExpanded((v) => !v)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-primary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={14} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Transcrição Completa</span>
          </div>
          {transcriptExpanded
            ? <ChevronUp size={14} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
            : <ChevronDown size={14} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />}
        </button>
        {transcriptExpanded && (
          <div
            style={{
              padding: '0 16px 16px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <pre
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                margin: '12px 0 0',
                fontFamily: 'inherit',
              }}
            >
              {meeting.transcript}
            </pre>
          </div>
        )}
      </div>

      {/* Segments for curation */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
            Trechos para Curadoria
          </h3>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {selectedCount} de {segments.length} selecionados
          </span>
        </div>

        {segments.length === 0 ? (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
            Nenhum trecho disponível.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {segments.map((seg) => (
              <TrechoCard
                key={seg.id}
                segment={seg}
                onToggle={onSegmentToggle}
                onContextChange={onContextChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
