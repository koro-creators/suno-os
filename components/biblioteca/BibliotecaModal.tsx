'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Plus, Trash2, Upload } from 'lucide-react';
import { BibliotecaDocument } from '@/lib/biblioteca-types';
import FileTypeIcon from './FileTypeIcon';

interface BibliotecaModalProps {
  document: BibliotecaDocument | null;
  onSave: (data: Omit<BibliotecaDocument, 'id' | 'updatedAt' | 'createdBy'>) => void;
  onClose: () => void;
  allTags: string[];
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'transparent',
  border: '1px solid var(--border-subtle)',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: '0.8rem',
  color: 'var(--text-primary)',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.7rem',
  color: 'var(--text-secondary)',
  marginBottom: 4,
  fontWeight: 500,
};

function focusRing(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = 'var(--sun)';
  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
}

function blurRing(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = 'var(--border-subtle)';
  e.currentTarget.style.boxShadow = 'none';
}

const SCOPE_OPTIONS: { key: string; label: string; color: string }[] = [
  { key: 'suno', label: 'Suno', color: 'var(--sun)' },
  { key: 'santander', label: 'Santander', color: '#EF4444' },
  { key: 'vivo', label: 'Vivo', color: '#8B5CF6' },
  { key: 'americanas', label: 'Americanas', color: '#F97316' },
  { key: 'mrv', label: 'MRV', color: '#06B6D4' },
  { key: 'sicredi', label: 'Sicredi', color: '#22C55E' },
  { key: 'bmg', label: 'BMG', color: '#F472B6' },
  { key: 'stone', label: 'Stone', color: '#A3E635' },
];

const FILE_TYPE_OPTIONS = ['PDF', 'Imagem', 'Deck', 'Outro'];

export default function BibliotecaModal({ document, onSave, onClose, allTags }: BibliotecaModalProps) {
  const isEdit = document !== null;
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const [title, setTitle] = useState(document?.title ?? '');
  const [content, setContent] = useState(document?.content ?? '');
  const [scope, setScope] = useState<string[]>(document?.scope ?? []);
  const [tags, setTags] = useState<string[]>(document?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [links, setLinks] = useState<{ label: string; url: string }[]>(document?.links ?? []);
  const [files, setFiles] = useState<{ name: string; type: string; size: string }[]>(document?.files ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED_FILE_TYPES = '.pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.webp,.mp3,.wav,.mp4,.mov';

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    closeRef.current?.focus();
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const filteredSuggestions = useMemo(() => {
    if (!tagInput.trim()) return [];
    const lower = tagInput.toLowerCase();
    return allTags
      .filter((t) => t.toLowerCase().includes(lower) && !tags.includes(t))
      .slice(0, 5);
  }, [tagInput, allTags, tags]);

  useEffect(() => {
    setTagSuggestions(filteredSuggestions);
  }, [filteredSuggestions]);

  function toggleScope(key: string) {
    setScope((prev) => prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]);
    setErrors((prev) => { const n = { ...prev }; delete n.scope; return n; });
  }

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput('');
    setTagSuggestions([]);
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
  }

  function updateLink(idx: number, field: 'label' | 'url', value: string) {
    setLinks((prev) => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  }

  function removeLink(idx: number) {
    setLinks((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateFile(idx: number, field: 'name' | 'type' | 'size', value: string) {
    setFiles((prev) => prev.map((f, i) => i === idx ? { ...f, [field]: value } : f));
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSave() {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Título é obrigatório';
    if (scope.length === 0) newErrors.scope = 'Selecione pelo menos um escopo';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    onSave({ title, content, scope, tags, links, files });
  }

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Editar Item' : 'Novo Item'}
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
          maxWidth: 600,
          maxHeight: '80vh',
          overflow: 'auto',
          padding: 24,
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          ref={closeRef}
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

        {/* Title */}
        <h2 style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 20px' }}>
          {isEdit ? 'Editar Item' : 'Novo Item'}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 0. File Upload Zone */}
          <div>
            <label style={labelStyle}>Arquivo</label>
            <div
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
                const droppedFile = e.dataTransfer.files?.[0];
                if (droppedFile) setUploadFile(droppedFile);
              }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? 'var(--sun)' : 'var(--border-subtle)'}`,
                borderRadius: 8,
                padding: uploadFile ? '10px 12px' : '20px 12px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 150ms ease, background-color 150ms ease',
                backgroundColor: isDragging ? 'rgba(255,200,1,0.06)' : 'transparent',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setUploadFile(f);
                }}
              />
              {uploadFile ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileTypeIcon fileType={uploadFile.name.split('.').pop()} size={18} />
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{uploadFile.name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      {(uploadFile.size / 1024).toFixed(0)} KB
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setUploadFile(null); setUploadProgress(null); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, display: 'flex' }}
                  >
                    <X size={14} strokeWidth={1.5} />
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={20} strokeWidth={1.5} style={{ color: 'var(--text-muted)', marginBottom: 6 }} />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Arraste um arquivo ou clique para selecionar
                  </div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    PDF, Imagem, Audio, Video, Texto (max 50MB)
                  </div>
                </>
              )}
            </div>
            {/* Upload progress bar */}
            {uploadProgress !== null && (
              <div style={{ marginTop: 6 }}>
                <div style={{ width: '100%', height: 4, borderRadius: 2, backgroundColor: 'var(--border-subtle)' }}>
                  <div
                    style={{
                      width: `${uploadProgress}%`,
                      height: '100%',
                      borderRadius: 2,
                      backgroundColor: uploadProgress === 100 ? '#10B981' : 'var(--sun)',
                      transition: 'width 200ms ease',
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {uploadProgress === 100 ? 'Upload concluido' : `${uploadProgress}%`}
                </div>
              </div>
            )}
          </div>

          {/* 1. Título */}
          <div>
            <label style={labelStyle}>Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors((p) => { const n = { ...p }; delete n.title; return n; }); }}
              style={{ ...inputStyle, borderColor: errors.title ? '#EF4444' : undefined }}
              onFocus={focusRing}
              onBlur={blurRing}
            />
            {errors.title && <span style={{ fontSize: '0.65rem', color: '#EF4444', marginTop: 2, display: 'block' }}>{errors.title}</span>}
          </div>

          {/* 2. Conteúdo */}
          <div>
            <label style={labelStyle}>Conteúdo</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              style={{ ...inputStyle, resize: 'vertical' }}
              onFocus={focusRing as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
              onBlur={blurRing as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
            />
          </div>

          {/* 3. Escopo */}
          <div>
            <label style={labelStyle}>Escopo *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SCOPE_OPTIONS.map((opt) => {
                const active = scope.includes(opt.key);
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => toggleScope(opt.key)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      border: active ? `1.5px solid ${opt.color}` : '1px solid var(--border-subtle)',
                      backgroundColor: active ? `${opt.color}22` : 'transparent',
                      color: active ? opt.color : 'var(--text-muted)',
                      transition: 'all 150ms ease',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {errors.scope && <span style={{ fontSize: '0.65rem', color: '#EF4444', marginTop: 4, display: 'block' }}>{errors.scope}</span>}
          </div>

          {/* 4. Tags */}
          <div style={{ position: 'relative' }}>
            <label style={labelStyle}>Tags</label>
            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontSize: '0.65rem',
                      backgroundColor: 'var(--nebula)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                    >
                      <X size={10} strokeWidth={2} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Digite e pressione Enter ou vírgula"
              style={inputStyle}
              onFocus={focusRing}
              onBlur={(e) => { blurRing(e); setTimeout(() => setTagSuggestions([]), 150); }}
            />
            {tagSuggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '100%',
                  marginTop: 2,
                  backgroundColor: 'var(--deep)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  zIndex: 10,
                  overflow: 'hidden',
                }}
              >
                {tagSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--nebula)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 5. Links */}
          <div>
            <label style={labelStyle}>Links</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {links.map((link, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Label"
                    value={link.label}
                    onChange={(e) => updateLink(idx, 'label', e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                    onFocus={focusRing}
                    onBlur={blurRing}
                  />
                  <input
                    type="text"
                    placeholder="URL"
                    value={link.url}
                    onChange={(e) => updateLink(idx, 'url', e.target.value)}
                    style={{ ...inputStyle, flex: 2 }}
                    onFocus={focusRing}
                    onBlur={blurRing}
                  />
                  <button
                    type="button"
                    onClick={() => removeLink(idx)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, display: 'flex', flexShrink: 0 }}
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setLinks((prev) => [...prev, { label: '', url: '' }])}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 8,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.7rem',
                padding: '4px 0',
              }}
            >
              <Plus size={12} strokeWidth={1.5} /> Adicionar link
            </button>
          </div>

          {/* 6. Arquivos */}
          <div>
            <label style={labelStyle}>Arquivos</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {files.map((file, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Nome"
                    value={file.name}
                    onChange={(e) => updateFile(idx, 'name', e.target.value)}
                    style={{ ...inputStyle, flex: 2 }}
                    onFocus={focusRing}
                    onBlur={blurRing}
                  />
                  <select
                    value={file.type}
                    onChange={(e) => updateFile(idx, 'type', e.target.value)}
                    style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}
                    onFocus={focusRing as unknown as React.FocusEventHandler<HTMLSelectElement>}
                    onBlur={blurRing as unknown as React.FocusEventHandler<HTMLSelectElement>}
                  >
                    <option value="">Tipo</option>
                    {FILE_TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Tamanho"
                    value={file.size}
                    onChange={(e) => updateFile(idx, 'size', e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                    onFocus={focusRing}
                    onBlur={blurRing}
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, display: 'flex', flexShrink: 0 }}
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setFiles((prev) => [...prev, { name: '', type: '', size: '' }])}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 8,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.7rem',
                padding: '4px 0',
              }}
            >
              <Plus size={12} strokeWidth={1.5} /> Adicionar arquivo
            </button>
          </div>
        </div>

        {/* Footer buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              padding: '8px 16px',
              borderRadius: 8,
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              backgroundColor: 'var(--sun)',
              color: 'var(--void)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: '8px 20px',
              borderRadius: 8,
            }}
          >
            {isEdit ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  );
}
