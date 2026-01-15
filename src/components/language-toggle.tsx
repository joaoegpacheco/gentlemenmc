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

  // Get locale from URL pathname to ensure it's always in sync
  const getLocaleFromPath = (): string => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0 && (segments[0] === 'pt' || segments[0] === 'en')) {
      return segments[0];
    }
    return locale; // Fallback to useLocale if pathname doesn't have locale
  };

  const currentLocale = getLocaleFromPath();

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
    return currentLocale === systemLocale;
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
          className={currentLocale === 'pt' && !isSystemLocale() ? 'bg-accent' : ''}
        >
          {t('portuguese')}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => changeLocale('en')}
          className={currentLocale === 'en' && !isSystemLocale() ? 'bg-accent' : ''}
        >
          {t('english')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
