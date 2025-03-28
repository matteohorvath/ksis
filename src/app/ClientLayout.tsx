"use client";

import { ReactNode } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

export default function ClientLayout({ children }: { children: ReactNode }) {
  const { locale } = useLanguage();

  return <div lang={locale}>{children}</div>;
}
