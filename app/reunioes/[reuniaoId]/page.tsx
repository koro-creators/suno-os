'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Check, Archive } from 'lucide-react';
import AppHeader from '@/components/layout/AppHeader';
import TranscricaoPanel from '@/components/reunioes/TranscricaoPanel';
import { useMeetings } from '@/contexts/MeetingsContext';
import { MeetingSegment } from '@/lib/meeting-types';

interface Props {
  params: Promise<{ reuniaoId: string }>;
}

export default function CuradoriaPage({ params }: Props) {
  const { reuniaoId } = use(params);
  const router = useRouter();
  const { getMeeting, curateMeeting, updateStatus } = useMeetings();

  const meeting = getMeeting(reuniaoId);

  // Local copy of segments for editing before saving
  const [segments, setSegments] = useState<MeetingSegment[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (meeting?.segments) {
      setSegments(meeting.segments.map((s) => ({ ...s })));
    }
  }, [meeting?.id]);

  if (!meeting) {
    return (
      <>
        <AppHeader
          breadcrumbs={[
            { label: 'Reunioes', href: '/reunioes' },
            { label: 'Nao encontrada', href: '#' },
          ]}
          rightLabel="Admin"
        />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Reuniao nao encontrada.</p>
            <button
              onClick={() => router.push('/reunioes')}
              style={{
                marginTop: 12,
                padding: '8px 16px',
                fontSize: '0.8rem',
                borderRadius: 9999,
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Voltar para Reunioes
            </button>
          </div>
        </main>
      </>
    );
  }

  function handleSegmentToggle(id: string, selected: boolean) {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, selected } : s)));
  }

  function handleContextChange(id: string, context_note: string) {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, context_note } : s)));
  }

  function handleSaveForWiki() {
    if (!meeting) return;
    const selectedSegments = segments.filter((s) => s.selected);
    if (selectedSegments.length === 0) return;

    const meetingId = meeting.id;
    setSaving(true);
    // Simulate async save (stub)
    setTimeout(() => {
      curateMeeting(meetingId, {
        segments: segments.map((s) => ({
          id: s.id,
          selected: s.selected,
          context_note: s.context_note,
        })),
      });
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 600);
  }

  function handleArchive() {
    if (!meeting) return;
    updateStatus(meeting.id, 'archived');
    router.push('/reunioes');
  }

  const selectedCount = segments.filter((s) => s.selected).length;

  const STATUS_LABELS: Record<string, string> = {
    pending_review: 'Aguardando Curadoria',
    curated: 'Curado',
    archived: 'Arquivado',
  };

  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: 'Reunioes', href: '/reunioes' },
          { label: meeting.title, href: `/reunioes/${meeting.id}` },
        ]}
        rightLabel="Admin"
      />
      <main
        id="main-content"
        className="page-enter"
        style={{ flex: 1, overflow: 'auto', padding: 24, maxWidth: 900, margin: '0 auto', width: '100%' }}
      >
        {/* Back */}
        <button
          onClick={() => router.push('/reunioes')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            padding: 0,
            marginBottom: 20,
            transition: 'color 150ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          Todas as reunioes
        </button>

        {/* Meeting header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 400, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
                {meeting.title}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {meeting.client_id}
                </span>
                {meeting.duration_minutes != null && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {meeting.duration_minutes} min
                  </span>
                )}
                {meeting.participants && meeting.participants.length > 0 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {meeting.participants.join(', ')}
                  </span>
                )}
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: meeting.status === 'curated' ? '#4ade80' : meeting.status === 'archived' ? 'var(--text-muted)' : '#FFC801',
                    backgroundColor: meeting.status === 'curated' ? 'rgba(74,222,128,0.12)' : meeting.status === 'archived' ? 'rgba(255,255,255,0.05)' : 'rgba(255,200,1,0.12)',
                    padding: '2px 8px',
                    borderRadius: 9999,
                  }}
                >
                  {STATUS_LABELS[meeting.status] ?? meeting.status}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {meeting.status !== 'archived' && (
                <button
                  onClick={handleArchive}
                  title="Arquivar reuniao"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    fontSize: '0.75rem',
                    borderRadius: 9999,
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--twilight)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <Archive size={12} strokeWidth={1.5} />
                  Arquivar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Two-column layout: curation + preview */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(260px, 320px)', gap: 24, alignItems: 'start' }}>
          {/* Left: Transcricao + trechos */}
          <TranscricaoPanel
            meeting={meeting}
            segments={segments}
            onSegmentToggle={handleSegmentToggle}
            onContextChange={handleContextChange}
          />

          {/* Right: Preview + save */}
          <div
            style={{
              position: 'sticky',
              top: 80,
              backgroundColor: 'var(--deep)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={14} strokeWidth={1.5} style={{ color: 'var(--sun)' }} />
              <h3 style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
                Preview — Wiki
              </h3>
            </div>

            {selectedCount === 0 ? (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Selecione trechos na transcrição para ver o preview do que sera adicionado à Biblioteca.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                  {selectedCount} {selectedCount === 1 ? 'trecho' : 'trechos'} selecionado{selectedCount > 1 ? 's' : ''}
                </p>
                {segments
                  .filter((s) => s.selected)
                  .map((seg) => (
                    <div
                      key={seg.id}
                      style={{
                        backgroundColor: 'var(--nebula)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 8,
                        padding: 10,
                      }}
                    >
                      <p
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5,
                          margin: 0,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {seg.text}
                      </p>
                      {seg.context_note && (
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: '6px 0 0', fontStyle: 'italic' }}>
                          {seg.context_note}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}

            <button
              onClick={handleSaveForWiki}
              disabled={selectedCount === 0 || saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '10px 16px',
                fontSize: '0.8rem',
                fontWeight: 500,
                borderRadius: 9999,
                border: 'none',
                backgroundColor: selectedCount === 0 ? 'var(--nebula)' : saved ? '#4ade80' : 'var(--sun)',
                color: selectedCount === 0 ? 'var(--text-muted)' : 'var(--void)',
                cursor: selectedCount === 0 || saving ? 'not-allowed' : 'pointer',
                transition: 'all 150ms ease',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saved ? (
                <>
                  <Check size={14} strokeWidth={2} />
                  Salvo para revisao
                </>
              ) : saving ? (
                'Salvando...'
              ) : (
                <>
                  <BookOpen size={12} strokeWidth={1.5} />
                  Salvar para Wiki
                </>
              )}
            </button>

            {saved && (
              <p style={{ fontSize: '0.65rem', color: '#4ade80', textAlign: 'center', margin: 0, lineHeight: 1.4 }}>
                Trechos enviados para revisao HITL antes de entrar na Biblioteca.
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
