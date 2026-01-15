import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get messages for the default locale
  const messages = await getMessages({ locale: routing.defaultLocale });

  return (
    <NextIntlClientProvider messages={messages} locale={routing.defaultLocale}>
      {children}
    </NextIntlClientProvider>
  );
}
