"use client";

import React, { useEffect, useState } from "react";
import MonthSection from "@/components/MonthSection";

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

type Month = {
  name: string;
  competitions: Competition[];
};

type ApiResponse = {
  months: Month[];
};

export default function Home() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/competitions");

        if (!response.ok) {
          throw new Error("Failed to fetch competition data");
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError("Error loading competition data. Please try again later.");
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    // Trigger a re-fetch
    fetch("/api/competitions")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        return response.json();
      })
      .then((result) => {
        setData(result);
        setIsLoading(false);
      })
      .catch((err) => {
        setError("Error loading competition data. Please try again later.");
        setIsLoading(false);
        console.error("Error fetching data:", err);
      });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white py-6 shadow-md">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold">KSIS MTASZ</h1>
          <p className="mt-2 text-blue-100">
            Dance Competition Management System
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">
            Competition Results
          </h2>
          <p className="text-gray-600 mb-6">
            View upcoming and past dance competitions organized by KSIS MTASZ.
          </p>

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
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
              <button
                className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-1 px-3 rounded text-sm transition-colors"
                onClick={handleRetry}
                tabIndex={0}
                aria-label="Retry loading competition data"
              >
                Retry
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
                  No competition data available at the moment.
                </p>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="bg-gray-100 border-t border-gray-200 py-6">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>
            © {new Date().getFullYear()} KSIS MTASZ Dance Competition Management
            System
          </p>
        </div>
      </footer>
    </div>
  );
}
