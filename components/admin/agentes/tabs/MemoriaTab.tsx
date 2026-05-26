'use client';

import { useState, useRef } from 'react';
import { Document, TrashCan, Upload } from '@carbon/icons-react';
import { useAgents } from '@/contexts/AgentsContext';
import { Agent, MemoryFile } from '@/lib/agents-types';

const MAX_FILES = 10;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface Props {
  agent: Agent;
}

export default function MemoriaTab({ agent }: Props) {
  const { addMemoryFile, removeMemoryFile } = useAgents();
  const files = agent.memory_files ?? [];
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const remaining = MAX_FILES - files.length;
    Array.from(fileList)
      .slice(0, remaining)
      .forEach((file) => {
        const mock: MemoryFile = {
          id: crypto.randomUUID(),
          filename: file.name,
          content_type: file.type || 'application/octet-stream',
          size_bytes: file.size,
          created_at: new Date().toISOString(),
        };
        addMemoryFile(agent.id, mock);
      });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
        Arquivos de memória são injetados como contexto nas execuções do agente.{' '}
        {files.length}/{MAX_FILES} arquivos.
      </p>

      {/* Drop zone */}
      {files.length < MAX_FILES && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? 'var(--sun)' : 'var(--border-subtle)'}`,
            borderRadius: 12,
            padding: '32px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            backgroundColor: dragOver ? 'rgba(255,200,1,0.04)' : 'transparent',
            transition: 'all 150ms ease',
          }}
        >
          <Upload size={24} style={{ color: 'var(--text-muted)' }} />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            Arraste arquivos ou clique para selecionar
          </p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
            .txt, .md, .pdf, .doc, .docx · máx 25MB por arquivo
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".txt,.md,.pdf,.doc,.docx,text/plain,text/markdown,application/pdf"
            onChange={(e) => handleFiles(e.target.files)}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {files.length >= MAX_FILES && (
        <p style={{ fontSize: '0.75rem', color: '#F59E0B', margin: 0 }}>
          Limite de {MAX_FILES} arquivos atingido. Remova um arquivo para adicionar outro.
        </p>
      )}

      {/* Document list */}
      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {files.map((file) => (
            <FileRow
              key={file.id}
              file={file}
              onDelete={() => removeMemoryFile(agent.id, file.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FileRow({ file, onDelete }: { file: MemoryFile; onDelete: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        backgroundColor: 'var(--deep)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 8,
      }}
    >
      <Document size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {file.filename}
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          {formatSize(file.size_bytes)} · {formatDate(file.created_at)}
        </div>
      </div>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Remover ${file.filename}`}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          padding: 4,
          display: 'flex',
          borderRadius: 4,
          transition: 'color 150ms ease',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        <TrashCan size={14} />
      </button>
    </div>
  );
}
