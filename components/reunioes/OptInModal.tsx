'use client';

import { useState } from 'react';
import { Close, Upload, Video } from '@carbon/icons-react';
import { MeetingCreateData } from '@/lib/meeting-types';

interface Props {
  availableClients: string[];
  onClose: () => void;
  onSubmit: (data: MeetingCreateData) => void;
}

export default function OptInModal({ availableClients, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState(availableClients[0] ?? '');
  const [meetLink, setMeetLink] = useState('');
  const [transcript, setTranscript] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [participants, setParticipants] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = 'Título é obrigatório.';
    if (!clientId) next.clientId = 'Cliente é obrigatório.';
    if (!transcript.trim()) next.transcript = 'Transcrição é obrigatória.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const data: MeetingCreateData = {
      title: title.trim(),
      client_id: clientId,
      meet_link: meetLink.trim() || undefined,
      transcript: transcript.trim(),
      duration_minutes: durationMinutes ? parseInt(durationMinutes, 10) : undefined,
      participants: participants
        ? participants.split(',').map((p) => p.trim()).filter(Boolean)
        : undefined,
    };
    onSubmit(data);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setTranscript(text);
    };
    reader.readAsText(file);
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--deep)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px 0',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: 'rgba(255,200,1,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Video size={14} style={{ color: 'var(--sun)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Opt-in Nova Reunião
              </h2>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                Sempre opt-in explícito por reunião
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: 4,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <Close size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
              Título da Reunião *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Alinhamento de estratégia Q3"
              style={{
                width: '100%',
                backgroundColor: 'var(--nebula)',
                border: `1px solid ${errors.title ? '#f87171' : 'var(--border-subtle)'}`,
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--sun)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = errors.title ? '#f87171' : 'var(--border-subtle)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            {errors.title && <p style={{ fontSize: '0.7rem', color: '#f87171', marginTop: 4 }}>{errors.title}</p>}
          </div>

          {/* Client */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
              Cliente *
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'var(--nebula)',
                border: `1px solid ${errors.clientId ? '#f87171' : 'var(--border-subtle)'}`,
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--sun)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = errors.clientId ? '#f87171' : 'var(--border-subtle)'; }}
            >
              {availableClients.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.clientId && <p style={{ fontSize: '0.7rem', color: '#f87171', marginTop: 4 }}>{errors.clientId}</p>}
          </div>

          {/* Meet link (optional) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
              Link do Meet (opcional)
            </label>
            <input
              type="url"
              value={meetLink}
              onChange={(e) => setMeetLink(e.target.value)}
              placeholder="https://meet.google.com/..."
              style={{
                width: '100%',
                backgroundColor: 'var(--nebula)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--sun)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Participants (optional) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
              Participantes (separados por vírgula, opcional)
            </label>
            <input
              type="text"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              placeholder="Ana Souza, Carlos Lima..."
              style={{
                width: '100%',
                backgroundColor: 'var(--nebula)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--sun)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Duration (optional) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
              Duração em minutos (opcional)
            </label>
            <input
              type="number"
              min="1"
              max="720"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="Ex: 45"
              style={{
                width: '100%',
                backgroundColor: 'var(--nebula)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--sun)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Transcript */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Transcrição *
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.7rem',
                  color: 'var(--sun)',
                  cursor: 'pointer',
                }}
              >
                <Upload size={12} />
                Upload de arquivo
                <input
                  type="file"
                  accept=".txt,.md"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Cole a transcrição da reunião aqui ou faça upload de um arquivo .txt..."
              rows={6}
              style={{
                width: '100%',
                backgroundColor: 'var(--nebula)',
                border: `1px solid ${errors.transcript ? '#f87171' : 'var(--border-subtle)'}`,
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
                lineHeight: 1.6,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--sun)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = errors.transcript ? '#f87171' : 'var(--border-subtle)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            {errors.transcript && <p style={{ fontSize: '0.7rem', color: '#f87171', marginTop: 4 }}>{errors.transcript}</p>}
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Stub Fase 21 — integração Gemini Meet em fase posterior.
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                fontSize: '0.8rem',
                borderRadius: 9999,
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--twilight)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 20px',
                fontSize: '0.8rem',
                borderRadius: 9999,
                border: 'none',
                backgroundColor: 'var(--sun)',
                color: 'var(--void)',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'opacity 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              Iniciar Captura
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
