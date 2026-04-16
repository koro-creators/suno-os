'use client';

import { useState, useCallback } from 'react';
import {
  FileText, Image, Mic, Video, Search, Plus, Shield, Sparkles,
  BookOpen, Users, Globe, LayoutDashboard, ChevronLeft, ChevronRight,
  Heart, ThumbsUp, ThumbsDown, Copy, Bookmark, X, Trash2, GripVertical,
  MoreHorizontal, Send, MessageCircle, Settings, Sun, Moon, Check,
} from 'lucide-react';
import Toast from '@/components/ui/Toast';
import FileTypeIcon from '@/components/biblioteca/FileTypeIcon';

// ─── Section wrapper ────────────────────────────────────────────

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ marginBottom: 64 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <span style={{
          width: 3, height: 20, borderRadius: 2,
          background: 'linear-gradient(180deg, var(--sun), transparent)',
        }} />
        <h2 style={{
          fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.14em', color: 'var(--text-muted)', margin: 0,
        }}>
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function ComponentBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: 'var(--deep)', border: '1px solid var(--border-subtle)',
      borderRadius: 12, padding: 20, marginBottom: 16,
    }}>
      <span style={{
        display: 'block', fontSize: '0.6rem', fontWeight: 500, textTransform: 'uppercase',
        letterSpacing: '0.1em', color: 'var(--sun)', marginBottom: 12,
      }}>
        {label}
      </span>
      {children}
    </div>
  );
}

function ColorSwatch({ name, token, hex }: { name: string; token: string; hex: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 40, height: 40, borderRadius: 8,
        backgroundColor: `var(${token})`,
        border: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }} />
      <div>
        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)', display: 'block' }}>
          {name}
        </span>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
          {token} · {hex}
        </span>
      </div>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────

export default function DesignSystemPage() {
  const [toastVisible, setToastVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('Tab 1');
  const [toggleOn, setToggleOn] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleCloseToast = useCallback(() => setToastVisible(false), []);

  const NAV_ITEMS = [
    { label: 'Cores', href: '#cores' },
    { label: 'Tipografia', href: '#tipografia' },
    { label: 'Botões', href: '#botoes' },
    { label: 'Inputs', href: '#inputs' },
    { label: 'Cards', href: '#cards' },
    { label: 'Badges', href: '#badges' },
    { label: 'Tabs', href: '#tabs' },
    { label: 'Toggle', href: '#toggle' },
    { label: 'Toast', href: '#toast' },
    { label: 'Ícones', href: '#icones' },
    { label: 'File Types', href: '#filetypes' },
    { label: 'Feedback', href: '#feedback' },
    { label: 'Espaçamento', href: '#espacamento' },
    { label: 'Bordas', href: '#bordas' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar nav */}
      <nav style={{
        width: 200, flexShrink: 0, padding: '32px 16px',
        borderRight: '1px solid var(--border-subtle)',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>
        <div style={{
          fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.14em', color: 'var(--sun)', marginBottom: 20,
        }}>
          Design System
        </div>
        {NAV_ITEMS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            style={{
              display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)',
              padding: '6px 8px', borderRadius: 6, textDecoration: 'none',
              transition: 'color 150ms ease, background-color 150ms ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)';
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--surface-hover)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)';
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent';
            }}
          >
            {item.label}
          </a>
        ))}
      </nav>

      {/* Main content */}
      <main style={{ flex: 1, padding: '32px 48px', maxWidth: 900 }}>
        <h1 style={{
          fontSize: '2.5rem', fontWeight: 300, color: 'var(--text-primary)',
          margin: '0 0 8px', letterSpacing: '-0.02em',
        }}>
          sunOS
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 48px' }}>
          Component Library · Design System · Source of Truth
        </p>

        {/* ─── CORES ─── */}
        <Section id="cores" title="Cores">
          <ComponentBox label="Backgrounds">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <ColorSwatch name="Void" token="--void" hex="#080D14" />
              <ColorSwatch name="Deep" token="--deep" hex="#0F1923" />
              <ColorSwatch name="Nebula" token="--nebula" hex="#1B2B3A" />
              <ColorSwatch name="Twilight" token="--twilight" hex="#263A4D" />
            </div>
          </ComponentBox>

          <ComponentBox label="Text">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <ColorSwatch name="Primary" token="--text-primary" hex="#F1F5F9" />
              <ColorSwatch name="Secondary" token="--text-secondary" hex="#94A3B8" />
              <ColorSwatch name="Muted" token="--text-muted" hex="#64748B" />
            </div>
          </ComponentBox>

          <ComponentBox label="Accent & Functional">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <ColorSwatch name="Sun (accent)" token="--sun" hex="#FFC801" />
              <ColorSwatch name="Criação" token="--criacao" hex="#FFC801" />
              <ColorSwatch name="Mídia" token="--midia" hex="#3B82F6" />
              <ColorSwatch name="Planejamento" token="--planejamento" hex="#10B981" />
            </div>
          </ComponentBox>

          <ComponentBox label="Cores de Clientes">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { name: 'Suno', color: '#FFC801' },
                { name: 'Vivo', color: '#8B5CF6' },
                { name: 'Americanas', color: '#F97316' },
                { name: 'Sicredi', color: '#22C55E' },
                { name: 'Samsung', color: '#3B82F6' },
              ].map((c) => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    width: 16, height: 16, borderRadius: '50%',
                    backgroundColor: c.color, flexShrink: 0,
                  }} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    {c.name} <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.6rem' }}>{c.color}</span>
                  </span>
                </div>
              ))}
            </div>
          </ComponentBox>
        </Section>

        {/* ─── TIPOGRAFIA ─── */}
        <Section id="tipografia" title="Tipografia">
          <ComponentBox label="Escala Tipográfica">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>H1 — 2rem / weight 300</span>
                <p style={{ fontSize: '2rem', fontWeight: 300, color: 'var(--text-primary)', margin: '4px 0 0' }}>Heading Principal</p>
              </div>
              <div>
                <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Body — 0.875rem / weight 400</span>
                <p style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.5 }}>
                  Texto de corpo usado em descrições, parágrafos e conteúdo principal. Line-height de 1.5 para legibilidade.
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Label — 0.75rem / weight 500</span>
                <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', margin: '4px 0 0' }}>Label de formulário ou seção</p>
              </div>
              <div>
                <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Metadata — 0.65rem / weight 400</span>
                <p style={{ fontSize: '0.65rem', fontWeight: 400, color: 'var(--text-muted)', margin: '4px 0 0' }}>Editado há 3d · v2 · 5 feedbacks</p>
              </div>
              <div>
                <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Micro — 0.55rem / uppercase / tracking</span>
                <p style={{ fontSize: '0.55rem', fontWeight: 500, color: 'var(--text-muted)', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Navegação · Criação · Sistema Solar</p>
              </div>
            </div>
          </ComponentBox>
        </Section>

        {/* ─── BOTÕES ─── */}
        <Section id="botoes" title="Botões">
          <ComponentBox label="Variantes">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 6,
                backgroundColor: 'var(--sun)', color: 'var(--void)',
                border: 'none', borderRadius: 9999, padding: '8px 16px',
                fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer',
                minHeight: 44, transition: 'opacity 150ms ease',
              }}>
                <Plus size={14} strokeWidth={2} /> Primário
              </button>

              <button style={{
                display: 'flex', alignItems: 'center', gap: 6,
                backgroundColor: 'transparent', color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)', borderRadius: 8,
                padding: '8px 16px', fontSize: '0.875rem', cursor: 'pointer',
                minHeight: 44, transition: 'border-color 150ms ease',
              }}>
                Ghost
              </button>

              <button style={{
                display: 'flex', alignItems: 'center', gap: 6,
                backgroundColor: 'transparent', color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)', borderRadius: 8,
                padding: '8px 16px', fontSize: '0.875rem', cursor: 'pointer',
                minHeight: 44, opacity: 0.5,
              }} disabled>
                Disabled
              </button>

              <button style={{
                display: 'flex', alignItems: 'center', gap: 6,
                backgroundColor: 'transparent', color: '#EF4444',
                border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8,
                padding: '8px 16px', fontSize: '0.875rem', cursor: 'pointer',
                minHeight: 44,
              }}>
                <Trash2 size={14} strokeWidth={1.5} /> Destructive
              </button>
            </div>
          </ComponentBox>

          <ComponentBox label="Tamanhos">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button style={{
                backgroundColor: 'var(--sun)', color: 'var(--void)', border: 'none',
                borderRadius: 9999, padding: '4px 10px', fontSize: '0.65rem',
                fontWeight: 500, cursor: 'pointer',
              }}>Small</button>
              <button style={{
                backgroundColor: 'var(--sun)', color: 'var(--void)', border: 'none',
                borderRadius: 9999, padding: '8px 16px', fontSize: '0.875rem',
                fontWeight: 500, cursor: 'pointer',
              }}>Default</button>
              <button style={{
                backgroundColor: 'var(--sun)', color: 'var(--void)', border: 'none',
                borderRadius: 9999, padding: '12px 24px', fontSize: '1rem',
                fontWeight: 500, cursor: 'pointer',
              }}>Large</button>
            </div>
          </ComponentBox>

          <ComponentBox label="Icon Buttons">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {[Settings, Search, Plus, X, Copy, Bookmark].map((Icon, i) => (
                <button key={i} aria-label="icon" style={{
                  width: 36, height: 36, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', background: 'transparent',
                  border: '1px solid var(--border-subtle)', borderRadius: 9999,
                  color: 'var(--text-muted)', cursor: 'pointer',
                  transition: 'color 150ms ease, border-color 150ms ease',
                }}>
                  <Icon size={14} strokeWidth={1.5} />
                </button>
              ))}
            </div>
          </ComponentBox>
        </Section>

        {/* ─── INPUTS ─── */}
        <Section id="inputs" title="Inputs">
          <ComponentBox label="Text Input">
            <div style={{ maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 500 }}>Nome *</label>
                <input type="text" placeholder="Digite aqui..." style={{
                  width: '100%', backgroundColor: 'transparent',
                  border: '1px solid var(--border-subtle)', borderRadius: 8,
                  padding: '8px 12px', fontSize: '0.875rem', color: 'var(--text-primary)',
                  outline: 'none',
                }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 500 }}>Descrição</label>
                <textarea placeholder="Descreva..." rows={3} style={{
                  width: '100%', backgroundColor: 'transparent',
                  border: '1px solid var(--border-subtle)', borderRadius: 8,
                  padding: '8px 12px', fontSize: '0.875rem', color: 'var(--text-primary)',
                  outline: 'none', resize: 'vertical',
                }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 500 }}>Tipo</label>
                <select style={{
                  width: '100%', backgroundColor: 'transparent',
                  border: '1px solid var(--border-subtle)', borderRadius: 8,
                  padding: '8px 12px', fontSize: '0.875rem', color: 'var(--text-primary)',
                  outline: 'none', cursor: 'pointer',
                }}>
                  <option>Criação</option>
                  <option>Mídia</option>
                  <option>Planejamento</option>
                </select>
              </div>
            </div>
          </ComponentBox>

          <ComponentBox label="Search Input (Pill)">
            <div style={{ position: 'relative', maxWidth: 300 }}>
              <Search size={13} strokeWidth={1.5} style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', pointerEvents: 'none',
              }} />
              <input type="text" placeholder="Buscar..." style={{
                width: '100%', backgroundColor: 'transparent',
                border: '1px solid var(--border-subtle)', borderRadius: 9999,
                padding: '8px 12px 8px 32px', fontSize: '0.8rem', color: 'var(--text-primary)',
                outline: 'none',
              }} />
            </div>
          </ComponentBox>
        </Section>

        {/* ─── CARDS ─── */}
        <Section id="cards" title="Cards">
          <ComponentBox label="Card Padrão (SkillCard style)">
            <div style={{
              maxWidth: 280, backgroundColor: 'var(--deep)',
              border: '1px solid var(--border-subtle)', borderRadius: 12,
              padding: 16, cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--criacao)' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>Copy Social</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--criacao)' }}>Criação</span>
                <span style={{ fontSize: '0.55rem', padding: '1px 6px', borderRadius: 9999, border: '1px solid rgba(16,185,129,0.4)', color: '#10B981' }}>Ativo</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>7 clientes · 3 moons</span>
              <br />
              <span style={{ fontSize: '0.65rem', color: 'var(--sun)' }}>★ 4.8 · 127 feedbacks</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 8 }}>
                <span>Editado há 2d</span>
                <span>v5</span>
              </div>
            </div>
          </ComponentBox>
        </Section>

        {/* ─── BADGES ─── */}
        <Section id="badges" title="Badges & Pills">
          <ComponentBox label="Status Badges">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.55rem', padding: '2px 8px', borderRadius: 9999, border: '1px solid rgba(16,185,129,0.4)', color: '#10B981' }}>Ativo</span>
              <span style={{ fontSize: '0.55rem', padding: '2px 8px', borderRadius: 9999, border: '1px solid rgba(255,200,1,0.25)', color: 'var(--sun)' }}>Rascunho</span>
              <span style={{ fontSize: '0.55rem', padding: '2px 8px', borderRadius: 9999, border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>Arquivado</span>
              <span style={{ fontSize: '0.55rem', padding: '2px 8px', borderRadius: 9999, border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>Erro</span>
              <span style={{ fontSize: '0.55rem', padding: '2px 8px', borderRadius: 9999, border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B' }}>Processando</span>
            </div>
          </ComponentBox>

          <ComponentBox label="Type Pills (Filter)">
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { label: 'Criação', color: 'var(--criacao)', active: true },
                { label: 'Mídia', color: 'var(--midia)', active: false },
                { label: 'Planejamento', color: 'var(--planejamento)', active: false },
              ].map((p) => (
                <button key={p.label} style={{
                  fontSize: '0.7rem', padding: '4px 10px', borderRadius: 9999,
                  border: `1px solid ${p.active ? p.color : 'var(--border-subtle)'}`,
                  backgroundColor: p.active ? `${p.color}18` : 'transparent',
                  color: p.active ? p.color : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}>
                  {p.label}
                </button>
              ))}
            </div>
          </ComponentBox>

          <ComponentBox label="Scope Pills (Multi-select)">
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {[
                { name: 'Suno', color: 'var(--sun)', active: true },
                { name: 'Vivo', color: '#8B5CF6', active: true },
                { name: 'Americanas', color: '#F97316', active: false },
                { name: 'Sicredi', color: '#22C55E', active: false },
              ].map((s) => (
                <button key={s.name} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: '0.7rem', padding: '4px 10px', borderRadius: 9999,
                  border: `1px solid ${s.active ? s.color : 'var(--border-subtle)'}`,
                  backgroundColor: s.active ? `${s.color}18` : 'transparent',
                  color: s.active ? s.color : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: s.color }} />
                  {s.name}
                </button>
              ))}
            </div>
          </ComponentBox>

          <ComponentBox label="Tag Chips">
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {['tendencias', 'digital', 'criacao', 'benchmark', 'concorrencia'].map((tag) => (
                <span key={tag} style={{
                  fontSize: '0.6rem', padding: '1px 6px', borderRadius: 9999,
                  border: '1px solid var(--border-subtle)', color: 'var(--text-muted)',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </ComponentBox>
        </Section>

        {/* ─── TABS ─── */}
        <Section id="tabs" title="Tabs">
          <ComponentBox label="Tab Navigation">
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border-subtle)', marginBottom: 12 }}>
              {['Tab 1', 'Tab 2', 'Tab 3', 'Tab 4'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: '10px 16px', fontSize: '0.8rem',
                  color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                  backgroundColor: 'transparent', border: 'none',
                  borderBottom: activeTab === tab ? '2px solid var(--sun)' : '2px solid transparent',
                  cursor: 'pointer', transition: 'color 150ms ease',
                }}>
                  {tab}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Conteúdo da {activeTab}. Sun underline indica tab ativa.
            </p>
          </ComponentBox>
        </Section>

        {/* ─── TOGGLE ─── */}
        <Section id="toggle" title="Toggle Switch">
          <ComponentBox label="Switch (role=switch)">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                role="switch"
                aria-checked={toggleOn}
                onClick={() => setToggleOn(!toggleOn)}
                style={{
                  width: 36, height: 20, borderRadius: 10, border: 'none',
                  backgroundColor: toggleOn ? 'var(--sun)' : 'var(--nebula)',
                  cursor: 'pointer', position: 'relative',
                  transition: 'background-color 200ms ease',
                }}
              >
                <span style={{
                  position: 'absolute', top: 2,
                  left: toggleOn ? 18 : 2,
                  width: 16, height: 16, borderRadius: '50%',
                  backgroundColor: toggleOn ? 'var(--void)' : 'var(--text-muted)',
                  transition: 'left 200ms ease, background-color 200ms ease',
                }} />
              </button>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {toggleOn ? 'Ativado' : 'Desativado'}
              </span>
            </div>
          </ComponentBox>
        </Section>

        {/* ─── TOAST ─── */}
        <Section id="toast" title="Toast">
          <ComponentBox label="Toast Notification">
            <button
              onClick={() => setToastVisible(true)}
              style={{
                backgroundColor: 'var(--sun)', color: 'var(--void)', border: 'none',
                borderRadius: 9999, padding: '8px 16px', fontSize: '0.875rem',
                fontWeight: 500, cursor: 'pointer',
              }}
            >
              Mostrar Toast
            </button>
            <Toast message="Item salvo com sucesso" visible={toastVisible} onClose={handleCloseToast} />
          </ComponentBox>
        </Section>

        {/* ─── ÍCONES ─── */}
        <Section id="icones" title="Ícones (Lucide)">
          <ComponentBox label="14px / strokeWidth 1.5 (padrão)">
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[
                { icon: Globe, name: 'Globe' }, { icon: Users, name: 'Users' },
                { icon: Sparkles, name: 'Sparkles' }, { icon: BookOpen, name: 'BookOpen' },
                { icon: Shield, name: 'Shield' }, { icon: Settings, name: 'Settings' },
                { icon: Search, name: 'Search' }, { icon: Plus, name: 'Plus' },
                { icon: X, name: 'X' }, { icon: Copy, name: 'Copy' },
                { icon: Bookmark, name: 'Bookmark' }, { icon: Send, name: 'Send' },
                { icon: Heart, name: 'Heart' }, { icon: ThumbsUp, name: 'ThumbsUp' },
                { icon: ThumbsDown, name: 'ThumbsDown' }, { icon: Trash2, name: 'Trash2' },
                { icon: GripVertical, name: 'GripVertical' }, { icon: MoreHorizontal, name: 'More' },
                { icon: ChevronLeft, name: 'ChevronL' }, { icon: ChevronRight, name: 'ChevronR' },
              ].map(({ icon: Icon, name }) => (
                <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <Icon size={14} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>{name}</span>
                </div>
              ))}
            </div>
          </ComponentBox>
        </Section>

        {/* ─── FILE TYPES ─── */}
        <Section id="filetypes" title="File Type Icons">
          <ComponentBox label="FileTypeIcon Component">
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {(['pdf', 'docx', 'txt', 'md', 'png', 'jpg', 'mp3', 'wav', 'mp4', 'mov'] as const).map((type) => (
                <div key={type} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <FileTypeIcon fileType={type} size={20} />
                  <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{type}</span>
                </div>
              ))}
            </div>
          </ComponentBox>
        </Section>

        {/* ─── FEEDBACK ─── */}
        <Section id="feedback" title="Feedback (HITL)">
          <ComponentBox label="Action Buttons">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.7rem' }}>
                <Copy size={14} strokeWidth={1.5} /> Copiar
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.7rem' }}>
                <Sparkles size={14} strokeWidth={1.5} /> Gerar variação
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.7rem' }}>
                <Bookmark size={14} strokeWidth={1.5} fill={saved ? 'var(--text-muted)' : 'none'} /> Salvar
              </button>
              <button onClick={() => setLiked(!liked)} aria-pressed={liked} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                <ThumbsUp size={14} strokeWidth={1.5} style={{ color: liked ? '#10B981' : 'var(--text-muted)' }} />
              </button>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                <ThumbsDown size={14} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
          </ComponentBox>

          <ComponentBox label="HITL Badge">
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                backgroundColor: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 9999, padding: '4px 10px',
              }}
            >
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                backgroundColor: 'var(--planejamento)',
              }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--planejamento)' }}>
                Human in the Loop
              </span>
            </div>
          </ComponentBox>
        </Section>

        {/* ─── ESPAÇAMENTO ─── */}
        <Section id="espacamento" title="Espaçamento">
          <ComponentBox label="Spacing Scale">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { token: 'xs', value: '4px' },
                { token: 'sm', value: '8px' },
                { token: 'md', value: '16px' },
                { token: 'lg', value: '24px' },
                { token: 'xl', value: '32px' },
                { token: '2xl', value: '48px' },
              ].map((s) => (
                <div key={s.token} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', width: 30, fontFamily: 'monospace' }}>{s.token}</span>
                  <div style={{
                    width: parseInt(s.value), height: 12,
                    backgroundColor: 'var(--sun)', borderRadius: 2, opacity: 0.6,
                  }} />
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </ComponentBox>
        </Section>

        {/* ─── BORDAS ─── */}
        <Section id="bordas" title="Bordas & Radius">
          <ComponentBox label="Border Radius Scale">
            <div style={{ display: 'flex', gap: 16, alignItems: 'end' }}>
              {[
                { token: 'input', value: '8px', size: 48 },
                { token: 'card', value: '12px', size: 64 },
                { token: 'pill', value: '9999px', size: 48 },
              ].map((r) => (
                <div key={r.token} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: r.size, height: r.size,
                    border: '2px solid var(--sun)',
                    borderRadius: r.value, opacity: 0.6,
                  }} />
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{r.token}</span>
                  <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </ComponentBox>

          <ComponentBox label="Focus Ring">
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{
                width: 80, height: 40, borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.65rem', color: 'var(--text-muted)',
              }}>Normal</div>
              <div style={{
                width: 80, height: 40, borderRadius: 8,
                border: '1px solid var(--sun)',
                boxShadow: '0 0 0 2px rgba(255,200,1,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.65rem', color: 'var(--sun)',
              }}>Focused</div>
            </div>
          </ComponentBox>
        </Section>

        {/* Footer */}
        <div style={{
          marginTop: 64, padding: '24px 0',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.65rem', color: 'var(--text-muted)',
        }}>
          sunOS Design System · Source of Truth: <code style={{ color: 'var(--sun)' }}>design-system/MASTER.md</code>
        </div>
      </main>
    </div>
  );
}
