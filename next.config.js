/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
      hostname: 'cuqvbjobsgfbfahjrzeq.supabase.co',
      pathname: '/**', // Corresponde a todas as rotas dentro desse domínio
      },
    ],
  },
};

module.exports = nextConfig;
