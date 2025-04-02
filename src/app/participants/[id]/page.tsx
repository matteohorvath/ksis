"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageContext";
import Navbar from "@/components/Navbar";
import Link from "next/link";

type Competition = {
  date: string;
  event: string;
  category: string;
  participantsCount: string;
  position: string;
  standard: string;
  latin: string;
  points: string;
  eventLink?: string;
  categoryLink?: string;
};

type ParticipantData = {
  name: string;
  club: string;
  ageGroup?: string;
  standardClass?: string;
  latinClass?: string;
  competitions: Competition[];
};

export default function ParticipantPage() {
  const { t } = useLanguage();
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<ParticipantData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/participant?id=${id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch participant data");
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(
          t("main.error.message") || "An error occurred while fetching data"
        );
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, t]);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);

    fetch(`/api/participant?id=${id}`)
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
        setError(
          t("main.error.message") || "An error occurred while fetching data"
        );
        setIsLoading(false);
        console.error("Error fetching data:", err);
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

        <section className="mb-8">
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
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-2xl font-bold text-blue-900 mb-2">
                {data.name}
              </h1>
              <p className="text-gray-700 mb-4">{data.club}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {data.ageGroup && (
                  <div className="bg-blue-50 p-4 rounded border border-blue-100">
                    <p className="text-gray-700">
                      <span className="font-semibold">
                        {t("participant.ageGroup") || "Age Group"}:{" "}
                      </span>
                      {data.ageGroup}
                    </p>
                  </div>
                )}

                {data.standardClass && (
                  <div className="bg-blue-50 p-4 rounded border border-blue-100">
                    <p className="text-gray-700">
                      <span className="font-semibold">
                        {t("participant.standardClass") || "Standard Class"}:{" "}
                      </span>
                      {data.standardClass}
                    </p>
                  </div>
                )}

                {data.latinClass && (
                  <div className="bg-blue-50 p-4 rounded border border-blue-100">
                    <p className="text-gray-700">
                      <span className="font-semibold">
                        {t("participant.latinClass") || "Latin Class"}:{" "}
                      </span>
                      {data.latinClass}
                    </p>
                  </div>
                )}
              </div>

              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {t("participant.competitionHistory") || "Competition History"}
              </h2>

              {data.competitions && data.competitions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {t("participant.date") || "Date"}
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {t("participant.event") || "Event"}
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {t("participant.category") || "Category"}
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {t("participant.participants") || "Participants"}
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {t("participant.position") || "Position"}
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {t("participant.standard") || "STD"}
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {t("participant.latin") || "LAT"}
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {t("participant.points") || "Points"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.competitions.map((competition, index) => (
                        <tr
                          key={index}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {competition.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {competition.event}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {competition.categoryLink ? (
                              <Link
                                href={`/competitions/category/${
                                  competition.categoryLink.match(
                                    /id=(\d+)/
                                  )?.[1] || ""
                                }`}
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {competition.category}
                              </Link>
                            ) : (
                              competition.category
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {competition.participantsCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {competition.position}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {competition.standard}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {competition.latin}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {competition.points}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  {t("participant.noCompetitions") ||
                    "No competition history available"}
                </p>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="bg-gray-100 border-t border-gray-200 py-6">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>{t("footer.copyright") || "© 2023 Dance Sport Organization"}</p>
        </div>
      </footer>
    </div>
  );
}
