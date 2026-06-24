'use client';

import { useState } from 'react';
import { Play, Time } from '@carbon/icons-react';
import { Agent } from '@/lib/agents-types';
import { apiAvailable } from '@/lib/api';

interface Props {
  agent: Agent;
}

type RunStatus = 'idle' | 'running' | 'completed' | 'failed' | 'timed_out';

interface PreviewResult {
  status: RunStatus;
  output: { text?: string } | null;
  error_message: string | null;
  duration_ms: number | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

const MOCK_RESULT: PreviewResult = {
  status: 'completed',
  output: {
    text: '[Preview mock — API não disponível]\n\nO agente processou sua mensagem com sucesso no modo de simulação. Conecte o backend para ver respostas reais do LangGraph.',
  },
  error_message: null,
  duration_ms: 420,
};

export default function PreviewTab({ agent }: Props) {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<RunStatus>('idle');
  const [result, setResult] = useState<PreviewResult | null>(null);

  const canRun = agent.status === 'active' || agent.status === 'draft';

  async function handleRun() {
    if (!message.trim() || status === 'running') return;

    setStatus('running');
    setResult(null);

    if (!apiAvailable()) {
      await new Promise((r) => setTimeout(r, 800));
      setResult(MOCK_RESULT);
      setStatus('completed');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/agents/${agent.id}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setResult({
          status: 'failed',
          output: null,
          error_message: err.detail ?? `HTTP ${res.status}`,
          duration_ms: null,
        });
        setStatus('failed');
        return;
      }

      const data: PreviewResult = await res.json();
      setResult(data);
      setStatus(data.status);
    } catch (err) {
      setResult({
        status: 'failed',
        output: null,
        error_message: String(err),
        duration_ms: null,
      });
      setStatus('failed');
    }
  }

  const outputText =
    result?.output && typeof result.output === 'object' && 'text' in result.output
      ? (result.output as { text: string }).text
      : result?.output
        ? JSON.stringify(result.output, null, 2)
        : null;

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Warning if agent is not active */}
      {agent.status !== 'active' && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#F59E0B18',
            border: '1px solid #F59E0B44',
            borderRadius: 8,
            fontSize: '0.78rem',
            color: '#F59E0B',
            marginBottom: 20,
          }}
        >
          Este agente está em modo <strong>{agent.status}</strong>. O preview funciona, mas o agente
          pode não ter todas as skills configuradas.
        </div>
      )}

      {/* Input */}
      <div style={{ marginBottom: 12 }}>
        <label
          style={{
            display: 'block',
            fontSize: '0.72rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            marginBottom: 8,
          }}
        >
          Mensagem de teste
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleRun();
          }}
          placeholder="Digite uma mensagem para testar o agente..."
          rows={4}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: 'var(--nebula)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
            lineHeight: 1.5,
            boxSizing: 'border-box',
            transition: 'border-color 150ms ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--twilight)';
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.1)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
          ⌘ + Enter para executar
        </p>
      </div>

      {/* Run button */}
      <button
        onClick={handleRun}
        disabled={!message.trim() || status === 'running'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 16px',
          backgroundColor: status === 'running' ? 'var(--nebula)' : 'var(--sun)',
          color: status === 'running' ? 'var(--text-muted)' : '#000',
          border: 'none',
          borderRadius: 8,
          fontSize: '0.82rem',
          fontWeight: 600,
          cursor: status === 'running' || !message.trim() ? 'not-allowed' : 'pointer',
          opacity: !message.trim() ? 0.5 : 1,
          transition: 'background-color 150ms ease, opacity 150ms ease',
          marginBottom: 24,
        }}
      >
        {status === 'running' ? (
          <>
            <Time size={14} />
            Executando...
          </>
        ) : (
          <>
            <Play size={14} />
            Executar Preview
          </>
        )}
      </button>

      {/* Result */}
      {result && (
        <div
          style={{
            backgroundColor: 'var(--deep)',
            border: `1px solid ${
              result.status === 'completed'
                ? '#10B98133'
                : result.status === 'timed_out'
                  ? '#6B728033'
                  : '#EF444433'
            }`,
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {/* Result header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 14px',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--nebula)',
            }}
          >
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color:
                  result.status === 'completed'
                    ? '#10B981'
                    : result.status === 'timed_out'
                      ? '#6B7280'
                      : '#EF4444',
              }}
            >
              {result.status === 'completed'
                ? 'Concluído'
                : result.status === 'timed_out'
                  ? 'Timeout'
                  : 'Falhou'}
            </span>
            {result.duration_ms !== null && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {result.duration_ms < 1000
                  ? `${result.duration_ms}ms`
                  : `${(result.duration_ms / 1000).toFixed(1)}s`}
              </span>
            )}
          </div>

          {/* Output or error */}
          <div style={{ padding: '14px' }}>
            {result.error_message ? (
              <pre
                style={{
                  margin: 0,
                  fontSize: '0.78rem',
                  color: '#EF4444',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {result.error_message}
              </pre>
            ) : outputText ? (
              <p
                style={{
                  margin: 0,
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {outputText}
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Sem output.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
