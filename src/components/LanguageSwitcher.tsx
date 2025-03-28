"use client";

import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { locales, Locale } from "@/i18n/config";

const LanguageSwitcher: React.FC = () => {
  const { locale, setLocale } = useLanguage();

  const handleChange = (newLocale: Locale) => {
    setLocale(newLocale);
  };

  return (
    <div className="flex space-x-2">
      {Object.entries(locales).map(([key, label]) => (
        <button
          key={key}
          onClick={() => handleChange(key as Locale)}
          className={`px-2 py-1 text-sm rounded-md transition-colors ${
            locale === key
              ? "bg-blue-700 text-white"
              : "bg-blue-100 text-blue-900 hover:bg-blue-200"
          }`}
          aria-label={`Switch language to ${label}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
