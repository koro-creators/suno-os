/** @type {import('next').NextConfig} */

// Backend do Venus que a feature Projetos (pacote @koro-creators/projetos)
// consome. O pacote chama caminhos relativos sob /venus; o Next reescreve para o
// backend do Venus (server-side) — sem CORS, e o header Authorization é
// repassado (mesmo projeto Firebase → token do sunOS valida no Venus). Definir
// VENUS_API_URL no build/deploy (ex.: https://venus-api-xxxx.run.app). Vazio →
// sem rewrite (a aba Projetos não funciona até configurar).
const VENUS_API_URL = process.env.VENUS_API_URL || '';

const nextConfig = {
  // Emite um servidor Node self-contained em .next/standalone para imagem Docker
  // enxuta no Cloud Run (sunos-frontend). Ver Dockerfile na raiz.
  output: 'standalone',
  // O pacote da feature Projetos é distribuído como TS cru; o Next o transpila.
  transpilePackages: ['@koro-creators/projetos'],
  async rewrites() {
    if (!VENUS_API_URL) return [];
    return [
      { source: '/venus/api/:path*', destination: `${VENUS_API_URL}/api/:path*` },
      { source: '/venus/outputs/:path*', destination: `${VENUS_API_URL}/outputs/:path*` },
    ];
  },
  async redirects() {
    return [
      // Drive OAuth migrado para aba no editor de cliente — SPEC-022 (2026-05-26)
      {
        source: '/configuracoes/drive',
        destination: '/configuracoes',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
