"use client";

import React, { useEffect, useState } from "react";
import MonthSection from "@/components/MonthSection";
import { useLanguage } from "@/i18n/LanguageContext";
import Navbar from "@/components/Navbar";

type Category = {
  name: string;
  url: string;
};

type Competition = {
  date: string;
  title: string;
  location: string;
  categories: Category[];
  url: string;
  organizer?: string;
  deadline?: string;
};

type Month = {
  name: string;
  competitions: Competition[];
};

type ApiResponse = {
  months: Month[];
};

export default function UpcomingCompetitions() {
  const { t } = useLanguage();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/upcoming-competitions");

        if (!response.ok) {
          throw new Error("Failed to fetch upcoming competition data");
        }

        const result = await response.json();
        setData(result);

        // Determine which year competitions are from
        if (
          result.months.length > 0 &&
          result.months[0].competitions.length > 0
        ) {
          const firstCompDate = result.months[0].competitions[0].date;
          if (firstCompDate) {
            const yearFromData = parseInt(firstCompDate.split(".")[0]);
            setYear(yearFromData);
          }
        }
      } catch (err) {
        setError(t("main.error.message"));
        console.error("Error fetching upcoming competitions data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [t]);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    // Trigger a re-fetch
    fetch("/api/upcoming-competitions")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch upcoming competition data");
        }
        return response.json();
      })
      .then((result) => {
        setData(result);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(t("main.error.message"));
        setIsLoading(false);
        console.error("Error fetching upcoming competitions data:", err);
      });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">
            {t("navigation.upcomingCompetitions")} {year}
          </h2>
          <p className="text-gray-600 mb-6">{t("main.calendar.description")}</p>

          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          {error && (
            <div
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6"
              role="alert"
            >
              <strong className="font-bold">{t("main.error.title")} </strong>
              <span className="block sm:inline">{error}</span>
              <button
                className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-1 px-3 rounded text-sm transition-colors"
                onClick={handleRetry}
                tabIndex={0}
                aria-label="Retry loading upcoming competition data"
              >
                {t("main.error.retry")}
              </button>
            </div>
          )}

          {!isLoading && !error && data && (
            <div className="space-y-8">
              {data.months.map((month, index) => (
                <MonthSection
                  key={index}
                  name={month.name}
                  competitions={month.competitions}
                />
              ))}

              {data.months.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  {t("main.noUpcomingCompetitions")}
                </p>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="bg-gray-100 border-t border-gray-200 py-6">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>{t("footer.copyright")}</p>
        </div>
      </footer>
    </div>
  );
}
