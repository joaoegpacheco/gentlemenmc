import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['pt', 'en'],

  // Used when no locale matches or browser language doesn't match supported locales
  // This is only used as a fallback - user's explicit choice (via cookie/URL) takes priority
  defaultLocale: 'pt',

  // Enable automatic locale detection based on browser/system language
  // This respects user's explicit choice stored in cookie first, then detects from browser
  localeDetection: true,

  // Configure cookie to persist user's locale preference
  // This ensures that when user chooses a language, it's remembered
  localeCookie: {
    name: 'NEXT_LOCALE',
    maxAge: 60 * 60 * 24 * 365, // 1 year - persist user's choice
    sameSite: 'lax' as const,
    path: '/'
  }
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
