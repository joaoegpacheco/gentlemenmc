import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {
      root: __dirname,
    },
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "cuqvbjobsgfbfahjrzeq.supabase.co",
        },
      ],
    },
  };

export default withNextIntl(nextConfig);
