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
};

type MonthlyCompetitions = {
  [month: string]: Competition[];
};

export default function PreviousCompetitions() {
  const { t } = useLanguage();
  const [data, setData] = useState<MonthlyCompetitions | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(
    currentYear.toString()
  );

  const years = Array.from({ length: 10 }, (_, i) =>
    (currentYear - i).toString()
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const url = selectedYear
          ? `/api/previous-competitions?year=${selectedYear}`
          : "/api/previous-competitions";

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to fetch previous competition data");
        }

        const result = await response.json();

        // Transform categories from string[] to Category[]
        const transformedData: MonthlyCompetitions = {};
        Object.keys(result).forEach((month) => {
          transformedData[month] = result[month].map(
            (comp: {
              date: string;
              title: string;
              location: string;
              categories: string[];
              url: string;
            }) => ({
              ...comp,
              categories: comp.categories.map((cat: string) => ({
                name: cat,
                url: "#", // Default URL as it's not available in the API
              })),
            })
          );
        });

        setData(transformedData);
      } catch (err) {
        setError(t("main.error.message"));
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [t, selectedYear]);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    // Trigger a re-fetch
    const url = selectedYear
      ? `/api/previous-competitions?year=${selectedYear}`
      : "/api/previous-competitions";

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        return response.json();
      })
      .then((result) => {
        // Transform categories from string[] to Category[]
        const transformedData: MonthlyCompetitions = {};
        Object.keys(result).forEach((month) => {
          transformedData[month] = result[month].map(
            (comp: {
              date: string;
              title: string;
              location: string;
              categories: string[];
              url: string;
            }) => ({
              ...comp,
              categories: comp.categories.map((cat: string) => ({
                name: cat,
                url: "#", // Default URL as it's not available in the API
              })),
            })
          );
        });

        setData(transformedData);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(t("main.error.message"));
        setIsLoading(false);
        console.error("Error fetching data:", err);
      });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">
            {t("navigation.previousCompetitions")}
          </h2>
          <p className="text-gray-600 mb-6">{t("main.calendar.description")}</p>

          <div className="mb-6">
            <label
              htmlFor="year-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("main.filter.year")}
            </label>
            <div className="flex">
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
                aria-label="Retry loading competition data"
              >
                {t("main.error.retry")}
              </button>
            </div>
          )}

          {!isLoading && !error && data && (
            <div className="space-y-8">
              {Object.keys(data).map((month) => (
                <MonthSection
                  key={month}
                  name={month}
                  competitions={data[month]}
                />
              ))}

              {Object.keys(data).length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  {t("main.noData")}
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
