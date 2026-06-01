'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import { Globe } from '@carbon/icons-react';
import Link from 'next/link';
import { clients } from '@/data/clients';
import AppHeader from '@/components/layout/AppHeader';
import QuickStats from '@/components/solar/QuickStats';
import { useAuth } from '@/contexts/AuthContext';
import WelcomeScreen from '@/components/solar/WelcomeScreen';

// Sort clients by skill count — fewer skills closer to sun
const sorted = [...clients].sort((a, b) => a.skills.length - b.skills.length);

// Planet sizes following real solar system proportions:
// Mercury(40), Venus(55), Earth(65), Jupiter(110)
const solarSizes = [40, 55, 65, 110];

const totalSkills = clients.reduce((sum, c) => sum + c.skills.length, 0);

// Sun center X = left(-280) + 620/2 = 30px from left edge
const sunCenterX = 30;
const orbitRadii = sorted.map((_, idx) => 440 + idx * 130);

export default function Home() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  // WelcomeScreen is shown when the solar system has no clients (defensive — static array
  // is non-empty in the deployed mock, but handles a future empty-state gracefully).
  if (clients.length === 0) {
    return (
      <main className="page-enter flex flex-col h-screen overflow-hidden bg-void">
        <AppHeader
          breadcrumbs={[{ label: 'Home', href: '/' }]}
          rightLabel="0 clientes"
        />
        <WelcomeScreen />
      </main>
    );
  }

  return (
    <main className="page-enter flex flex-col h-screen overflow-hidden bg-void">
      <AppHeader
        breadcrumbs={[{ label: 'Home', href: '/' }]}
        rightLabel={`${clients.length} clientes`}
      />

      <QuickStats />

      <div id="main-content" className="flex-1 relative min-h-0">
        {/* Sun — anchored to left edge, half visible */}
        <div
          style={{
            position: 'absolute',
            left: -280,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 620,
            height: 620,
            borderRadius: '50%',
            backgroundColor: 'var(--sun)',
            boxShadow: 'none',
            zIndex: 5,
          }}
        />

        {/* Empty state — only visible when clients list is empty */}
        {clients.length === 0 && !loading && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              zIndex: 20,
            }}
          >
            <Globe
              size={48}
              style={{ color: 'var(--text-muted)' }}
            />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Nenhum cliente no sistema solar
            </span>
            {isAdmin && (
              <Link
                href="/clientes/new"
                style={{
                  padding: '6px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  textDecoration: 'none',
                  transition: 'border-color 150ms ease, color 150ms ease',
                }}
              >
                Adicionar cliente
              </Link>
            )}
          </div>
        )}

        {/* Orbit semicircles + planets (or skeletons while loading) */}
        {(() => {
          const yOffsets = [0, 0, 0, 0];

          return (
            <>
              {/* Orbit semicircles — always visible */}
              {orbitRadii.map((radius, idx) => {
                const diameter = radius * 2;
                return (
                  <div
                    key={`orbit-semi-${idx}`}
                    style={{
                      position: 'absolute',
                      left: sunCenterX - radius,
                      top: `calc(50% - ${radius}px)`,
                      width: diameter,
                      height: diameter,
                      borderRadius: '50%',
                      border: '1px solid var(--orbit-line)',
                      boxShadow: '0 0 8px rgba(255,200,1,0.02), inset 0 0 8px rgba(255,200,1,0.01)',
                      pointerEvents: 'none',
                      zIndex: 1,
                    }}
                  />
                );
              })}

              {loading
                ? /* Skeleton planets */
                  sorted.map((client, idx) => {
                    const size = solarSizes[idx] ?? 50;
                    const radius = orbitRadii[idx];
                    const planetX = sunCenterX + radius;
                    return (
                      <div
                        key={`skeleton-${client.slug}`}
                        className="orbit-appear"
                        style={{
                          position: 'absolute',
                          left: planetX - size / 2,
                          top: `calc(50% - ${size / 2}px)`,
                          width: size,
                          height: size,
                          borderRadius: '50%',
                          backgroundColor: 'var(--nebula)',
                          animation: 'pulse 1.4s ease-in-out infinite',
                          animationDelay: `${idx * 120}ms`,
                          zIndex: 10,
                        }}
                      />
                    );
                  })
                : /* Real planets */
                  sorted.map((client, idx) => {
                    const size = solarSizes[idx] ?? 50;
                    const radius = orbitRadii[idx];
                    const planetX = sunCenterX + radius;
                    const yOffset = yOffsets[idx] ?? 0;

                    return (
                      <Planet
                        key={client.slug}
                        client={client}
                        size={size}
                        planetX={planetX}
                        yOffset={yOffset}
                        delay={idx * 80}
                        onClick={() => router.push(`/${client.slug}`)}
                      />
                    );
                  })}
            </>
          );
        })()}

        {/* Editorial typography */}
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            right: 28,
            textAlign: 'right',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div style={{ fontSize: '3rem', fontWeight: 200, color: 'var(--editorial-text)', lineHeight: 1, letterSpacing: '-0.02em' }}>01</div>
          <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--editorial-label)', marginTop: 4 }}>Sistema Solar</div>
          <div style={{ fontSize: '0.45rem', letterSpacing: '0.08em', color: 'var(--editorial-meta)', marginTop: 3 }}>{clients.length} clientes &middot; {totalSkills} skills</div>
        </div>
      </div>
    </main>
  );
}

// Planet component with label on top + connector line
function Planet({
  client,
  size,
  planetX,
  yOffset,
  delay,
  onClick,
}: {
  client: typeof clients[number];
  size: number;
  planetX: number;
  yOffset: number;
  delay: number;
  onClick: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const metaRef = useRef<HTMLSpanElement>(null);
  const [navigating, setNavigating] = useState(false);
  const [focusVisible, setFocusVisible] = useState(false);
  const ambientGlow = 'none';

  const handleClick = () => {
    setNavigating(true);
    onClick();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className="orbit-appear"
      role="button"
      tabIndex={0}
      aria-label={`${client.name} — ${client.skills.length} skills`}
      style={{
        position: 'absolute',
        left: planetX - size / 2,
        top: `calc(50% - ${size / 2}px)`,
        width: size,
        height: size,
        cursor: navigating ? 'wait' : 'pointer',
        animationDelay: `${delay}ms`,
        zIndex: 10,
        opacity: navigating ? 0.5 : 1,
        outline: 'none',
        transition: 'opacity 200ms ease',
        pointerEvents: navigating ? 'none' : 'auto',
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onFocus={() => setFocusVisible(true)}
      onBlur={() => setFocusVisible(false)}
      onMouseEnter={() => {
        if (ref.current) {
          ref.current.style.transform = 'scale(1.08)';
          ref.current.style.boxShadow = 'none';
        }
        if (labelRef.current) labelRef.current.style.color = 'var(--text-primary)';
        if (metaRef.current) metaRef.current.style.color = 'var(--text-secondary)';
      }}
      onMouseLeave={() => {
        if (ref.current) {
          ref.current.style.transform = 'scale(1)';
          ref.current.style.boxShadow = 'none';
        }
        if (labelRef.current) labelRef.current.style.color = 'var(--text-secondary)';
        if (metaRef.current) metaRef.current.style.color = 'var(--text-muted)';
      }}
    >
      {/* Label + meta + connector — positioned above the circle */}
      <div
        style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: 6,
          pointerEvents: 'none',
        }}
      >
        <span
          ref={labelRef}
          className="solar-label"
          style={{
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-secondary)',
            transition: 'color 200ms ease',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            marginBottom: 2,
          }}
        >
          {client.name}
        </span>
        <span
          ref={metaRef}
          className="solar-meta"
          style={{
            fontSize: '0.5rem',
            letterSpacing: '0.04em',
            color: 'var(--text-muted)',
            transition: 'color 200ms ease',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            marginBottom: 4,
          }}
        >
          {client.skills.length} skills
        </span>
        <div
          style={{
            width: 1,
            height: 20,
            background: 'linear-gradient(180deg, var(--connector-color) 0%, var(--connector-fade) 100%)',
          }}
        />
      </div>

      {/* Planet circle — this is what aligns to the orbit */}
      <div
        ref={ref}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: client.color,
          boxShadow: focusVisible ? '0 0 0 3px rgba(255,200,1,0.5)' : 'none',
          transition: 'transform 200ms ease-out, box-shadow 200ms ease-out',
        }}
      />
    </div>
  );
}
