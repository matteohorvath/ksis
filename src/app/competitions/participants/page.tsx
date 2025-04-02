"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageContext";
import Navbar from "@/components/Navbar";
import Link from "next/link";

type Participant = {
  number: string;
  name: string;
  club: string;
  country?: string;
};

type Category = {
  name: string;
  participants: Participant[];
};

type CompetitionData = {
  title: string;
  date: string;
  location: string;
  participantCount: string;
  categories: Category[];
};

export default function ParticipantsPage() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [data, setData] = useState<CompetitionData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("No competition ID provided");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/competition-participants?id=${id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch participant data");
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(
          t("main.error.message") || "An error occurred while fetching data"
        );
        console.error("Error fetching participants data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, t]);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    // Trigger a re-fetch
    fetch(`/api/competition-participants?id=${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch participant data");
        }
        return response.json();
      })
      .then((result) => {
        setData(result);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(
          t("main.error.message") || "An error occurred while fetching data"
        );
        setIsLoading(false);
        console.error("Error fetching participants data:", err);
      });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Link
            href="/competitions/upcoming"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            {t("navigation.back") || "Back to Competitions"}
          </Link>
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
            <strong className="font-bold">
              {t("main.error.title") || "Error"}{" "}
            </strong>
            <span className="block sm:inline">{error}</span>
            <button
              className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-1 px-3 rounded text-sm transition-colors"
              onClick={handleRetry}
              tabIndex={0}
              aria-label="Retry loading participant data"
            >
              {t("main.error.retry") || "Retry"}
            </button>
          </div>
        )}

        {!isLoading && !error && data && (
          <>
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-blue-900 mb-2">
                {data.title}
              </h2>
              <p className="text-gray-600 mb-1">{data.date}</p>
              <p className="text-gray-600 mb-2">{data.location}</p>
              <p className="text-gray-600 mb-4">{data.participantCount}</p>

              <div className="space-y-8 mt-6">
                {data.categories.map((category, index) => (
                  <div
                    key={`category-${index}`}
                    className="border rounded-lg overflow-hidden bg-white shadow-sm"
                  >
                    <h3 className="bg-blue-100 text-blue-800 font-bold p-3 border-b">
                      {category.name}
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              #
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {t("participants.name") || "Name"}
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {t("participants.club") || "Club"}
                            </th>
                            {category.participants.some((p) => p.country) && (
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {t("participants.country") || "Country"}
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {category.participants.map((participant, pIndex) => (
                            <tr
                              key={`participant-${pIndex}`}
                              className={
                                pIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                              }
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {participant.number}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {participant.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {participant.club}
                              </td>
                              {category.participants.some((p) => p.country) && (
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {participant.country || ""}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {!isLoading && !error && !data && !id && (
          <div className="text-center py-12">
            <p className="text-gray-600">
              {t("participants.noIdProvided") ||
                "No competition ID provided. Please select a competition from the calendar."}
            </p>
          </div>
        )}
      </main>

      <footer className="bg-gray-100 border-t border-gray-200 py-6">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>{t("footer.copyright") || "© 2023 Dance Sport Organization"}</p>
        </div>
      </footer>
    </div>
  );
}
