import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['pt', 'en'],

  // Used when no locale matches or browser language doesn't match supported locales
  defaultLocale: 'en',

  // Enable automatic locale detection based on browser/system language
  localeDetection: true
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
