'use client';

/**
 * ShootForTheMoonModal — modal principal do motor de serendipidade.
 *
 * Atende SPEC-004 §FR-008 (acionamento em ≤3 cliques) e §FR-009 (Explorer pipeline).
 *
 * Estados:
 *  - 'idle'         → input do briefing
 *  - 'processando'  → animação "Devorando referências…"
 *  - 'resultado'    → renderiza FaiscaPanel
 *  - 'error'        → mensagem de erro com retry
 *
 * Vocabulário Suno: "Devore o briefing", "Faíscas".
 */

import { useState, useEffect } from 'react';
import { Sparkles, X, Send, AlertCircle } from 'lucide-react';
import FaiscaPanel, { type IntensityMode } from './FaiscaPanel';
import { type FaiscaData } from './FaiscaCard';

interface ShootForTheMoonModalProps {
  open: boolean;
  onClose: () => void;
  clientName?: string;
  initialBriefing?: string;
  /** Callback que dispara o pipeline backend (mock no POC) */
  onShoot?: (briefing: string, intensity: IntensityMode) => Promise<FaiscaData[]>;
}

type State = 'idle' | 'processando' | 'resultado' | 'error';

export default function ShootForTheMoonModal({
  open,
  onClose,
  clientName,
  initialBriefing = '',
  onShoot,
}: ShootForTheMoonModalProps) {
  const [briefing, setBriefing] = useState(initialBriefing);
  const [intensity, setIntensity] = useState<IntensityMode>('equilibrado');
  const [state, setState] = useState<State>('idle');
  const [faiscas, setFaiscas] = useState<FaiscaData[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      setBriefing(initialBriefing);
      setState('idle');
      setFaiscas([]);
      setErrorMsg(null);
    }
  }, [open, initialBriefing]);

  // Escape para fechar
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state !== 'processando') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, state, onClose]);

  if (!open) return null;

  const handleShoot = async () => {
    if (!briefing.trim()) return;
    setState('processando');
    setErrorMsg(null);
    try {
      // Mock fallback se onShoot não for fornecido (POC standalone)
      const result = onShoot
        ? await onShoot(briefing, intensity)
        : await mockShoot(briefing, intensity);
      setFaiscas(result);
      setState('resultado');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Travei. Tenta de novo.');
      setState('error');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Shoot for the Moon"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(8, 13, 20, 0.85)',
        backdropFilter: 'blur(4px)',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && state !== 'processando') onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 920,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--deep)',
          border: '1px solid var(--twilight)',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={18} strokeWidth={1.5} color="var(--sun)" />
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              Shoot for the Moon
              {clientName && (
                <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8, fontSize: 14 }}>
                  · {clientName}
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            disabled={state === 'processando'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              backgroundColor: 'transparent',
              color: 'var(--text-muted)',
              border: 'none',
              borderRadius: 8,
              cursor: state === 'processando' ? 'not-allowed' : 'pointer',
              opacity: state === 'processando' ? 0.4 : 1,
              transition: 'all 150ms ease',
            }}
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </header>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {state === 'idle' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label htmlFor="sftm-briefing" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Manda o briefing aí. Eu mastigo.
              </label>
              <textarea
                id="sftm-briefing"
                value={briefing}
                onChange={(e) => setBriefing(e.target.value)}
                placeholder="Ex: Campanha de fim de ano para Vivo Fibra, foco em famílias que querem mais conexão durante feriados…"
                rows={6}
                style={{
                  width: '100%',
                  padding: 12,
                  backgroundColor: 'var(--nebula)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                  resize: 'vertical',
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <small style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  Estímulos para você criar — não são peças finais.
                </small>
                <button
                  onClick={handleShoot}
                  disabled={!briefing.trim()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    backgroundColor: briefing.trim() ? 'var(--sun)' : 'var(--nebula)',
                    color: briefing.trim() ? 'var(--void)' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: 9999,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: briefing.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 150ms ease',
                  }}
                >
                  <Send size={14} strokeWidth={1.5} />
                  Devorar
                </button>
              </div>
            </div>
          )}

          {state === 'processando' && (
            <div
              role="status"
              aria-live="polite"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                padding: 64,
                color: 'var(--text-secondary)',
              }}
            >
              <DevorandoAnimation />
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
                Mastigando referências…
              </p>
              <small style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Pode levar até 30 segundos.
              </small>
            </div>
          )}

          {state === 'resultado' && (
            <FaiscaPanel
              faiscas={faiscas}
              intensity={intensity}
              onIntensityChange={(m) => {
                setIntensity(m);
                handleShoot();
              }}
              onRefresh={handleShoot}
              onClose={onClose}
            />
          )}

          {state === 'error' && (
            <div
              role="alert"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: 48,
                color: 'var(--text-secondary)',
              }}
            >
              <AlertCircle size={32} strokeWidth={1.5} color="#EF4444" />
              <p style={{ fontSize: 14, color: 'var(--text-primary)', margin: 0 }}>
                {errorMsg ?? 'Travei. Tenta de novo.'}
              </p>
              <button
                onClick={handleShoot}
                style={{
                  marginTop: 12,
                  padding: '8px 18px',
                  backgroundColor: 'var(--sun)',
                  color: 'var(--void)',
                  border: 'none',
                  borderRadius: 9999,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Devorar de novo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Auxiliares ----------

function DevorandoAnimation() {
  return (
    <div
      style={{
        display: 'inline-flex',
        gap: 6,
      }}
      aria-hidden="true"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: 'var(--sun)',
            animation: `pulse 1.4s ease-in-out ${i * 0.16}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// Mock para uso standalone no POC sem backend
async function mockShoot(_briefing: string, _intensity: IntensityMode): Promise<FaiscaData[]> {
  await new Promise((r) => setTimeout(r, 1800));
  return [
    {
      id: 'mock-1',
      title: 'O ritual do silêncio compartilhado',
      concepts: [
        { name: 'Conexão familiar', domain: 'antropologia' },
        { name: 'Ondas longas no rádio AM', domain: 'engenharia' },
      ],
      narrative:
        'Antes de WhatsApp, famílias dispersas pelo Brasil sintonizavam o mesmo rádio à mesma hora. A presença era no silêncio simultâneo. E se a Vivo voltasse esse gesto?',
      zone: 'sweet-spot',
      agentPersona: 'antropofaga',
    },
    {
      id: 'mock-2',
      title: 'Feriado é a casa que se mexe',
      concepts: [
        { name: 'Casa móvel', domain: 'arquitetura' },
        { name: 'Diáspora interna', domain: 'sociologia' },
      ],
      narrative:
        'A casa não fica parada quando todos viajam — ela vai junto, no roteador na bagagem. Talvez a verdadeira "casa conectada" seja a que se desmonta e remonta em outro lugar.',
      zone: 'sweet-spot',
      agentPersona: 'carnavalesco',
    },
    {
      id: 'mock-3',
      title: 'E se o feriado fosse silêncio total?',
      concepts: [
        { name: 'Detox digital', domain: 'comportamento' },
        { name: 'Marca anti-marca', domain: 'estratégia' },
      ],
      narrative:
        'Cético: por que vender mais conexão se o que falta é desconexão? Vivo poderia ser a primeira marca a vender feriado offline — e ganhar mais relevância com isso.',
      zone: 'radical',
      agentPersona: 'cetico',
    },
  ];
}
