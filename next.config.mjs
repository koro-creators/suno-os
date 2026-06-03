/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emite um servidor Node self-contained em .next/standalone para imagem Docker
  // enxuta no Cloud Run (sunos-frontend). Ver Dockerfile na raiz.
  output: 'standalone',
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
