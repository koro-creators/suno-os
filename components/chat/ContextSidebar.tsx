import { BibliotecaItem } from '@/lib/types';

interface ContextSidebarProps {
  biblioteca: BibliotecaItem[];
  agentes: string[];
}

function SectionHeader({ color, label }: { color: string; label: string }) {
  return (
    <div className="mb-sm flex items-center gap-sm">
      <span className="inline-block rounded-full" style={{ width: 6, height: 6, backgroundColor: color }} />
      <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">{label}</span>
    </div>
  );
}

export default function ContextSidebar({ biblioteca, agentes }: ContextSidebarProps) {
  return (
    <aside className="h-full overflow-y-auto border-l border-twilight" style={{ width: 280, padding: '1.25rem' }}>
      {/* Biblioteca */}
      <section className="mb-5">
        <SectionHeader color="var(--sun)" label="Biblioteca" />
        <div className="flex flex-col gap-xs">
          {biblioteca.map((item) => (
            <div
              key={item.id}
              className="rounded-input px-sm py-xs text-xs"
              style={{
                borderLeft: item.active ? '2px solid var(--sun)' : '2px solid transparent',
                backgroundColor: item.active ? 'rgba(255,200,1,0.06)' : 'transparent',
                color: item.active ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              {item.label}
            </div>
          ))}
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

      {/* Validacao */}
      <section className="mb-5">
        <SectionHeader color="var(--planejamento)" label="Validacao" />
        <div
          className="inline-flex items-center gap-sm rounded-pill px-sm py-xs"
          style={{
            backgroundColor: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
          }}
        >
          <span
            className="inline-block rounded-full"
            style={{
              width: 6,
              height: 6,
              backgroundColor: 'var(--planejamento)',
              animation: 'pulse-glow 2s infinite',
            }}
          />
          <span className="text-xs font-medium" style={{ color: 'var(--planejamento)' }}>
            Human in the Loop
          </span>
        </div>
      </section>
    </aside>
  );
}
