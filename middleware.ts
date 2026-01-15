import createMiddleware from 'next-intl/middleware';
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from './src/i18n/routing';

const intlMiddleware = createMiddleware(routing);

export function middleware(req: NextRequest) {
  // First apply intl middleware to handle locale routing
  const response = intlMiddleware(req);
  
  const pathname = req.nextUrl.pathname;
  
  // Check if pathname starts with a locale
  const pathnameHasLocale = routing.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Get the locale from pathname or use default
  let locale: 'pt' | 'en' = routing.defaultLocale as 'pt';
  if (pathnameHasLocale) {
    const segments = pathname.split('/');
    const potentialLocale = segments[1];
    if (potentialLocale === 'pt' || potentialLocale === 'en') {
      locale = potentialLocale;
    }
  }

  // Check authentication for protected routes
  const token = req.cookies.get("authToken")?.value;
  const isAuthRoute = pathname === `/${locale}` || pathname === "/" || pathname === `/${locale}/`;
  const isApiRoute = pathname.startsWith('/api');
  const isPublicAsset = pathname.includes('.') || pathname.startsWith('/_next') || pathname.startsWith('/_vercel');
  
  // If no token and not on auth route, and not api/public asset, redirect to login with locale
  if (!token && !isAuthRoute && !isApiRoute && !isPublicAsset && pathnameHasLocale) {
    const loginUrl = new URL(`/${locale}`, req.url);
    return NextResponse.redirect(loginUrl);
  }
  
  return response;
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
