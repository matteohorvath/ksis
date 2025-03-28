"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Locale, defaultLocale, getLocaleFromString } from "./config";

// Import translations
import huTranslations from "./translations/hu.json";
import enTranslations from "./translations/en.json";

type TranslationValue = string | Record<string, unknown>;

type Translations = {
  [key: string]: TranslationValue;
};

const translations: Record<Locale, Translations> = {
  hu: huTranslations,
  en: enTranslations,
};

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

type LanguageProviderProps = {
  children: ReactNode;
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
}) => {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true when component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only run on client-side
    if (isClient) {
      // Check if there's a stored language preference
      const savedLocale = localStorage.getItem("language");
      if (savedLocale) {
        setLocale(getLocaleFromString(savedLocale));
      }
    }
  }, [isClient]);

  // Save language preference when it changes
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("language", locale);
    }
  }, [locale, isClient]);

  // Function to get translation by key
  const t = (key: string): string => {
    const keys = key.split(".");
    let current: TranslationValue | Record<string, TranslationValue> =
      translations[locale];

    for (const k of keys) {
      if (typeof current !== "object" || current === null || !(k in current)) {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
      current = current[k] as TranslationValue;
    }

    if (typeof current === "string") {
      // Handle simple placeholder like {year}
      return current.replace(/{(\w+)}/g, (_, placeholder) => {
        if (placeholder === "year") {
          return new Date().getFullYear().toString();
        }
        return placeholder;
      });
    }

    return key;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
