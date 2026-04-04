import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ locale: localeFromCall, requestLocale }) => {
  // `locale` is set when callers pass e.g. getMessages({ locale }) / getTranslations({ locale });
  // `requestLocale` is the [locale] segment (or undefined outside [locale]).
  let locale = localeFromCall ?? (await requestLocale);

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
