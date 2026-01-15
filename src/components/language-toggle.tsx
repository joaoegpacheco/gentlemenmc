"use client"

import * as React from "react"
import { Languages } from "lucide-react"
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function LanguageToggle() {
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const changeLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  const getSystemLocale = (): string => {
    if (typeof window === 'undefined') return 'en';
    const systemLang = navigator.language || (navigator as any).userLanguage;
    // Detecta se o idioma do sistema é português (pt, pt-BR, pt-PT, etc)
    if (systemLang.toLowerCase().startsWith('pt')) {
      return 'pt';
    }
    // Para qualquer outro idioma, usa inglês como padrão
    return 'en';
  };

  const handleSystemLocale = () => {
    const systemLocale = getSystemLocale();
    changeLocale(systemLocale);
  };

  const isSystemLocale = () => {
    const systemLocale = getSystemLocale();
    return locale === systemLocale;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">{t('language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={handleSystemLocale}
          className={isSystemLocale() ? 'bg-accent' : ''}
        >
          {t('system')}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => changeLocale('pt')}
          className={locale === 'pt' && !isSystemLocale() ? 'bg-accent' : ''}
        >
          {t('portuguese')}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => changeLocale('en')}
          className={locale === 'en' && !isSystemLocale() ? 'bg-accent' : ''}
        >
          {t('english')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
