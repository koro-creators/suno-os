/** @type {import('next').NextConfig} */
const nextConfig = {
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
