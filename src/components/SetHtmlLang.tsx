"use client";

import { useEffect } from "react";

/** Atualiza <html lang> sem aninhar outro <html> (layout raiz já possui a tag). */
export function SetHtmlLang({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
