"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const Navbar = () => {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-blue-900 text-white py-4 sm:py-6 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold">
              {t("header.title")}
            </h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-blue-100">
              {t("header.subtitle")}
            </p>
          </div>
          <div className="flex items-center space-x-4 sm:space-x-6">
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
              <Link
                href="/statistics"
                className={`py-2 px-3 rounded transition-colors ${
                  isActive("/statistics")
                    ? "bg-blue-700 text-white"
                    : "text-blue-100 hover:bg-blue-800"
                }`}
                tabIndex={0}
                aria-label={t("navigation.statistics")}
              >
                {t("navigation.statistics")}
              </Link>
            </div>
            <LanguageSwitcher />

            {/* Hamburger menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-blue-800 focus:outline-none"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile navigation menu */}
        <div
          className={`md:hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
          } overflow-hidden`}
        >
          <div className="flex flex-col space-y-2 pt-4">
            <Link
              href="/competitions/upcoming"
              className={`py-2 px-3 rounded transition-colors ${
                isActive("/competitions/upcoming")
                  ? "bg-blue-700 text-white"
                  : "text-blue-100 hover:bg-blue-800"
              }`}
              onClick={() => setIsMenuOpen(false)}
              tabIndex={0}
              aria-label={t("navigation.upcomingCompetitions")}
            >
              {t("navigation.upcomingCompetitions")}
            </Link>
            <Link
              href="/competitions/previous"
              className={`py-2 px-3 rounded transition-colors ${
                isActive("/competitions/previous")
                  ? "bg-blue-700 text-white"
                  : "text-blue-100 hover:bg-blue-800"
              }`}
              onClick={() => setIsMenuOpen(false)}
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
              onClick={() => setIsMenuOpen(false)}
              tabIndex={0}
              aria-label={t("navigation.rankings")}
            >
              {t("navigation.rankings")}
            </Link>
            <Link
              href="/statistics"
              className={`py-2 px-3 rounded transition-colors ${
                isActive("/statistics")
                  ? "bg-blue-700 text-white"
                  : "text-blue-100 hover:bg-blue-800"
              }`}
              onClick={() => setIsMenuOpen(false)}
              tabIndex={0}
              aria-label={t("navigation.statistics")}
            >
              {t("navigation.statistics")}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
