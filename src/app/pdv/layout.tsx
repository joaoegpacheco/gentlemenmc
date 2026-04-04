import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { ModeToggle } from '@/components/mode-toggle';

export const dynamic = 'force-dynamic';

export default async function PDVLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages({ locale: routing.defaultLocale });

  return (
    <NextIntlClientProvider messages={messages} locale={routing.defaultLocale}>
      <header className="fixed top-0 right-0 p-4 z-50 flex gap-2">
        <ModeToggle />
      </header>
      {children}
    </NextIntlClientProvider>
  );
}
