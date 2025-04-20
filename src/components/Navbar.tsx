"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const Navbar = () => {
  const pathname = usePathname();
  const { t } = useLanguage();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-blue-900 text-white py-6 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{t("header.title")}</h1>
            <p className="mt-2 text-blue-100">{t("header.subtitle")}</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex space-x-4">
              <Link
                href="/competitions/upcoming"
                className={`py-2 px-3 rounded transition-colors ${
                  isActive("/competitions/upcoming")
                    ? "bg-blue-700 text-white"
                    : "text-blue-100 hover:bg-blue-800"
                }`}
                tabIndex={0}
                aria-label={t("navigation.upcomingCompetitions")}
              >
                {t("navigation.upcomingCompetitions")}
              </Link>
              <Link
                href={`/competitions/previous/${new Date().getFullYear()}`}
                className={`py-2 px-3 rounded transition-colors ${
                  isActive("/competitions/previous")
                    ? "bg-blue-700 text-white"
                    : "text-blue-100 hover:bg-blue-800"
                }`}
                tabIndex={0}
                aria-label={t("navigation.previousCompetitions")}
              >
                {t("navigation.previousCompetitions")}
              </Link>
              <Link
                href="/rankings"
                className={`py-2 px-3 rounded transition-colors ${
                  isActive("/rankings")
                    ? "bg-blue-700 text-white"
                    : "text-blue-100 hover:bg-blue-800"
                }`}
                tabIndex={0}
                aria-label={t("navigation.rankings")}
              >
                {t("navigation.rankings")}
              </Link>
            </div>
            <LanguageSwitcher />
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden mt-4 flex space-x-2">
          <Link
            href="/competitions/upcoming"
            className={`flex-1 text-center py-2 px-3 rounded transition-colors ${
              isActive("/competitions/upcoming")
                ? "bg-blue-700 text-white"
                : "text-blue-100 hover:bg-blue-800"
            }`}
            tabIndex={0}
            aria-label={t("navigation.upcomingCompetitions")}
          >
            {t("navigation.upcomingCompetitions")}
          </Link>
          <Link
            href="/competitions/previous"
            className={`flex-1 text-center py-2 px-3 rounded transition-colors ${
              isActive("/competitions/previous")
                ? "bg-blue-700 text-white"
                : "text-blue-100 hover:bg-blue-800"
            }`}
            tabIndex={0}
            aria-label={t("navigation.previousCompetitions")}
          >
            {t("navigation.previousCompetitions")}
          </Link>
          <Link
            href="/rankings"
            className={`flex-1 text-center py-2 px-3 rounded transition-colors ${
              isActive("/rankings")
                ? "bg-blue-700 text-white"
                : "text-blue-100 hover:bg-blue-800"
            }`}
            tabIndex={0}
            aria-label={t("navigation.rankings")}
          >
            {t("navigation.rankings")}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
