'use client';

import { useState, useMemo } from 'react';
import { Plus, Search, X, ThumbsUp, ThumbsDown } from 'lucide-react';
import { BibliotecaDocument } from '@/lib/biblioteca-types';
import { MessageFeedback, SessionFeedback } from '@/lib/feedback-types';
import Toast from '@/components/ui/Toast';
import FileTypeIcon from '@/components/biblioteca/FileTypeIcon';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ContextSidebarProps {
  documents: BibliotecaDocument[];
  activeDocIds: string[];
  onToggleDoc: (id: string) => void;
  onAddDoc: (id: string) => void;
  agentes: string[];
  messages?: Message[];
  feedbacks?: Record<number, MessageFeedback>;
  sessionFeedback?: SessionFeedback | null;
  onSessionFeedback?: (f: SessionFeedback) => void;
}

function SectionHeader({ color, label }: { color: string; label: string }) {
  return (
    <div className="mb-sm flex items-center gap-sm">
      <span className="inline-block rounded-full" style={{ width: 6, height: 6, backgroundColor: color }} />
      <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">{label}</span>
    </div>
  );
}

export default function ContextSidebar({
  documents,
  activeDocIds,
  onToggleDoc,
  onAddDoc,
  agentes,
  messages = [],
  feedbacks = {},
  sessionFeedback,
  onSessionFeedback,
}: ContextSidebarProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionRating, setSessionRating] = useState(0);
  const [sessionComment, setSessionComment] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const activeDocs = useMemo(
    () => documents.filter((d) => activeDocIds.includes(d.id)),
    [documents, activeDocIds]
  );

  const inactiveDocs = useMemo(
    () => documents.filter((d) => !activeDocIds.includes(d.id)),
    [documents, activeDocIds]
  );

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return inactiveDocs.slice(0, 5);
    const q = searchQuery.toLowerCase();
    return inactiveDocs
      .filter((d) => d.title.toLowerCase().includes(q) || d.tags.some((t) => t.includes(q)))
      .slice(0, 5);
  }, [inactiveDocs, searchQuery]);

  // Feedback stats
  const assistantMessages = useMemo(
    () => messages.map((m, i) => ({ ...m, index: i })).filter((m) => m.role === 'assistant'),
    [messages]
  );

  const evaluatedFeedbacks = useMemo(
    () => Object.entries(feedbacks)
      .filter(([, f]) => f.rating !== null)
      .map(([idx, f]) => ({ index: Number(idx), ...f })),
    [feedbacks]
  );

  const approvedCount = evaluatedFeedbacks.filter((f) => f.rating === 'up').length;
  const rejectedCount = evaluatedFeedbacks.filter((f) => f.rating === 'down').length;
  const totalAssistant = assistantMessages.length;
  const evaluatedCount = evaluatedFeedbacks.length;
  const unevaluatedCount = totalAssistant - evaluatedCount;

  const sessionStatus = evaluatedCount === 0
    ? null
    : approvedCount > evaluatedCount / 2
      ? 'positive'
      : rejectedCount > evaluatedCount / 2
        ? 'review'
        : 'progress';

  const handleSessionSubmit = () => {
    if (sessionRating > 0 && onSessionFeedback) {
      onSessionFeedback({
        rating: sessionRating,
        comment: sessionComment,
        submittedAt: new Date().toISOString(),
      });
      setShowSessionForm(false);
      setToast('Sessão avaliada');
    }
  };

  return (
    <aside className="h-full overflow-y-auto border-l border-twilight" style={{ width: 280, padding: '1.25rem' }}>
      {/* Biblioteca */}
      <section className="mb-5">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <SectionHeader color="var(--sun)" label="Biblioteca" />
          <button
            aria-label="Adicionar contexto"
            onClick={() => setShowSearch(!showSearch)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 2,
              display: 'flex',
              borderRadius: 4,
              transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--sun)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
          >
            {showSearch ? <X size={12} strokeWidth={1.5} /> : <Plus size={12} strokeWidth={1.5} />}
          </button>
        </div>

        {showSearch && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ position: 'relative', marginBottom: 6 }}>
              <Search size={11} strokeWidth={1.5} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Buscar contexto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', backgroundColor: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '5px 8px 5px 24px', fontSize: '0.7rem', color: 'var(--text-primary)', outline: 'none' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--sun)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {searchResults.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => { onAddDoc(doc.id); setSearchQuery(''); }}
                  style={{ textAlign: 'left', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.7rem', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', transition: 'background-color 150ms ease' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--surface-hover)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <FileTypeIcon fileType={doc.fileType} size={10} /> {doc.title}
                  </span>
                </button>
              ))}
              {searchResults.length === 0 && (
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', padding: '4px 8px' }}>Nenhum resultado</span>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-xs">
          {activeDocs.map((doc) => (
            <div
              key={doc.id}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '2px solid var(--sun)', backgroundColor: 'rgba(255,200,1,0.06)', borderRadius: '0 8px 8px 0', padding: '6px 8px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, overflow: 'hidden' }}>
                <FileTypeIcon fileType={doc.fileType} size={12} />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {doc.title}
                </span>
              </div>
              <button
                role="switch"
                aria-checked={true}
                aria-label={`Desativar ${doc.title}`}
                onClick={() => onToggleDoc(doc.id)}
                style={{ width: 28, height: 16, borderRadius: 8, border: 'none', backgroundColor: 'var(--sun)', cursor: 'pointer', position: 'relative', flexShrink: 0, marginLeft: 6, transition: 'background-color 200ms ease' }}
              >
                <span style={{ position: 'absolute', top: 2, left: 14, width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--void)', transition: 'left 200ms ease' }} />
              </button>
            </div>
          ))}
          {activeDocs.length === 0 && (
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', padding: '4px 0' }}>Nenhum contexto ativo</span>
          )}
        </div>
      </section>

      {/* Agentes */}
      <section className="mb-5">
        <SectionHeader color="var(--midia)" label="Agentes" />
        <div className="flex flex-col gap-xs">
          {agentes.map((agente) => (
            <div key={agente} className="px-sm py-xs text-xs text-text-secondary">
              {agente}
            </div>
          ))}
        </div>
      </section>

      {/* Validação */}
      <section className="mb-5">
        <SectionHeader color="var(--planejamento)" label="Validação" />

        {/* HITL Badge */}
        <div
          className="inline-flex items-center gap-sm rounded-pill px-sm py-xs"
          style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', marginBottom: 10 }}
        >
          <span className="inline-block rounded-full" style={{ width: 6, height: 6, backgroundColor: 'var(--planejamento)', animation: 'pulse-glow 2s infinite' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--planejamento)' }}>Human in the Loop</span>
        </div>

        {/* Session score bar */}
        {totalAssistant > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
              {evaluatedCount} de {totalAssistant} mensagens avaliadas
            </div>
            {/* Progress bar */}
            <div style={{ width: '100%', height: 4, borderRadius: 2, backgroundColor: 'var(--border-subtle)', marginBottom: 6 }}>
              <div
                style={{
                  width: totalAssistant > 0 ? `${(evaluatedCount / totalAssistant) * 100}%` : '0%',
                  height: '100%',
                  borderRadius: 2,
                  backgroundColor: 'var(--planejamento)',
                  transition: 'width 200ms ease',
                }}
              />
            </div>
            {/* Counters */}
            <div style={{ display: 'flex', gap: 8, fontSize: '0.6rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#10B981' }} />
                <span style={{ color: 'var(--text-muted)' }}>{approvedCount} aprovadas</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#EF4444' }} />
                <span style={{ color: 'var(--text-muted)' }}>{rejectedCount} rejeitadas</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: 'var(--text-muted)' }} />
                <span style={{ color: 'var(--text-muted)' }}>{unevaluatedCount} sem</span>
              </span>
            </div>
            {/* Status badge */}
            {sessionStatus && (
              <div
                style={{
                  display: 'inline-flex',
                  marginTop: 6,
                  fontSize: '0.55rem',
                  padding: '1px 8px',
                  borderRadius: 9999,
                  border: `1px solid ${sessionStatus === 'positive' ? 'rgba(16,185,129,0.3)' : sessionStatus === 'review' ? 'rgba(239,68,68,0.3)' : 'var(--border-subtle)'}`,
                  color: sessionStatus === 'positive' ? '#10B981' : sessionStatus === 'review' ? '#EF4444' : 'var(--text-muted)',
                }}
              >
                {sessionStatus === 'positive' ? 'Sessão positiva' : sessionStatus === 'review' ? 'Precisa revisão' : 'Em progresso'}
              </div>
            )}
          </div>
        )}

        {/* Feedback list */}
        {evaluatedFeedbacks.length > 0 && (
          <div style={{ maxHeight: 140, overflowY: 'auto', marginBottom: 10 }}>
            {evaluatedFeedbacks.slice(0, 5).map((f) => {
              const msg = messages[f.index];
              return (
                <button
                  key={f.index}
                  role="button"
                  onClick={() => {
                    document.getElementById(`msg-${f.index}`)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 6,
                    width: '100%',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    padding: '4px 0',
                    cursor: 'pointer',
                    borderRadius: 4,
                  }}
                >
                  {f.rating === 'up' ? (
                    <ThumbsUp size={10} strokeWidth={1.5} style={{ color: '#10B981', flexShrink: 0, marginTop: 2 }} />
                  ) : (
                    <ThumbsDown size={10} strokeWidth={1.5} style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {msg?.content.slice(0, 30)}...
                    </div>
                    {f.comment && (
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.comment}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {evaluatedFeedbacks.length === 0 && totalAssistant > 0 && (
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 10 }}>
            Nenhuma avaliação ainda
          </div>
        )}

        {/* Session feedback */}
        {evaluatedCount > 0 && !sessionFeedback && !showSessionForm && (
          <button
            onClick={() => setShowSessionForm(true)}
            style={{
              fontSize: '0.7rem',
              padding: '5px 10px',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'border-color 150ms ease',
              width: '100%',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--twilight)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)'; }}
          >
            Avaliar sessão
          </button>
        )}

        {showSessionForm && !sessionFeedback && (
          <div style={{ marginTop: 8 }}>
            {/* Rating circles */}
            <div role="radiogroup" aria-label="Avaliação da sessão" style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  role="radio"
                  aria-checked={sessionRating >= n}
                  aria-label={`${n} de 5`}
                  onClick={() => setSessionRating(n)}
                  onMouseEnter={(e) => {
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      Array.from(parent.children).forEach((child, i) => {
                        (child as HTMLElement).style.backgroundColor = i < n ? 'var(--sun)' : 'transparent';
                      });
                    }
                  }}
                  onMouseLeave={(e) => {
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      Array.from(parent.children).forEach((child, i) => {
                        (child as HTMLElement).style.backgroundColor = i < sessionRating ? 'var(--sun)' : 'transparent';
                      });
                    }
                  }}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    border: `1px solid ${sessionRating >= n ? 'var(--sun)' : 'var(--border-subtle)'}`,
                    backgroundColor: sessionRating >= n ? 'var(--sun)' : 'transparent',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 150ms ease',
                  }}
                />
              ))}
            </div>
            <textarea
              placeholder="Como foi essa sessão?"
              value={sessionComment}
              onChange={(e) => setSessionComment(e.target.value)}
              rows={2}
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                padding: '5px 8px',
                fontSize: '0.7rem',
                color: 'var(--text-primary)',
                outline: 'none',
                resize: 'none',
                marginBottom: 6,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--sun)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setShowSessionForm(false)}
                style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border-subtle)', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSessionSubmit}
                style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: 6, border: 'none', backgroundColor: 'var(--sun)', color: 'var(--void)', cursor: 'pointer', fontWeight: 500 }}
              >
                Salvar
              </button>
            </div>
          </div>
        )}

        {sessionFeedback && (
          <div style={{ fontSize: '0.65rem', color: '#10B981', marginTop: 6 }}>
            Sessão avaliada ★ {sessionFeedback.rating}
          </div>
        )}
      </section>

      <Toast message={toast || ''} visible={!!toast} onClose={() => setToast(null)} />
    </aside>
  );
}
