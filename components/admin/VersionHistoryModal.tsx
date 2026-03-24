'use client';

import { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { SkillVersion } from '@/lib/admin-types';

interface VersionHistoryModalProps {
  skillName: string;
  versions: SkillVersion[];
  onClose: () => void;
  onRestore: (version: number) => void;
}

export default function VersionHistoryModal({ skillName, versions, onClose, onRestore }: VersionHistoryModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    firstFocusRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Histórico de Versões — ${skillName}`}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 90,
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--deep)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          width: '100%',
          maxWidth: 500,
          maxHeight: '70vh',
          overflow: 'auto',
          padding: 24,
          position: 'relative',
        }}
      >
        {/* Close */}
        <button
          ref={firstFocusRef}
          aria-label="Fechar"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
          }}
        >
          <X size={16} strokeWidth={1.5} />
        </button>

        <h2 style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 20px' }}>
          Histórico de Versões — {skillName}
        </h2>

        {/* Timeline */}
        <div style={{ position: 'relative', paddingLeft: 28 }}>
          {/* Vertical line */}
          <div
            style={{
              position: 'absolute',
              left: 11,
              top: 0,
              bottom: 0,
              width: 1,
              backgroundColor: 'var(--border-subtle)',
            }}
          />

          {versions.map((v, idx) => {
            const isCurrent = idx === 0;
            return (
              <div key={v.version} style={{ marginBottom: 20, position: 'relative' }}>
                {/* Version badge */}
                <div
                  style={{
                    position: 'absolute',
                    left: -28,
                    top: 0,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: isCurrent ? 'var(--sun)' : 'var(--nebula)',
                    color: isCurrent ? 'var(--void)' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.6rem',
                    fontWeight: 600,
                    zIndex: 1,
                  }}
                >
                  v{v.version}
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>
                    {v.date} · {v.author}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                    {v.summary}
                  </div>
                  {!isCurrent && (
                    <button
                      onClick={() => onRestore(v.version)}
                      style={{
                        fontSize: '0.65rem',
                        color: 'var(--text-muted)',
                        background: 'transparent',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 6,
                        padding: '2px 8px',
                        cursor: 'pointer',
                        transition: 'color 150ms ease, border-color 150ms ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--twilight)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)';
                      }}
                    >
                      Restaurar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
