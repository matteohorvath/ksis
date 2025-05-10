"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageContext";
import Navbar from "@/components/Navbar";
import Link from "next/link";

// Function to transliterate Hungarian characters to English equivalents
const transliterateHungarianToEnglish = (text: string): string => {
  const hungarianMap: { [key: string]: string } = {
    á: "a",
    Á: "A",
    é: "e",
    É: "E",
    í: "i",
    Í: "I",
    ó: "o",
    Ó: "O",
    ö: "o",
    Ö: "O",
    ő: "o",
    Ő: "O",
    ú: "u",
    Ú: "U",
    ü: "u",
    Ü: "U",
    ű: "u",
    Ű: "U",
  };

  return text
    .split("")
    .map((char) => hungarianMap[char] || char)
    .join("");
};

type Judge = {
  name: string;
  location: string;
  link?: string;
};

type Result = {
  position: string;
  number: string;
  name: string;
  club: string;
  section?: string;
  profileLink?: string;
};

type CompetitionResults = {
  title: string;
  date: string;
  location: string;
  organizer: string;
  organizerRepresentative?: string;
  type: string;
  participantCount?: string;
  judges: Judge[];
  commissioner?: string;
  supervisor?: string;
  announcer?: string;
  counters?: string[];
  results: Result[];
};

type MarkSection = {
  title: string;
  headers: string[];
  rows: { [key: string]: string }[];
};

type MarkData = {
  title: string;
  sections: MarkSection[];
};

export default function CategoryDetailPage() {
  const { t } = useLanguage();
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<CompetitionResults | null>(null);
  const [markData, setMarkData] = useState<MarkData | null>(null);
  const [skatingData, setSkatingData] = useState<MarkData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMarks, setIsLoadingMarks] = useState<boolean>(false);
  const [isLoadingSkating, setIsLoadingSkating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [markError, setMarkError] = useState<string | null>(null);
  const [skatingError, setSkatingError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("results");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/competition-results?id=${id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch competition results");
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(t("main.error.message"));
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, t]);

  const handleTabChange = async (tab: string) => {
    setActiveTab(tab);

    // Fetch marks data if needed
    if (tab === "marks" && !markData && !isLoadingMarks) {
      try {
        setIsLoadingMarks(true);
        const response = await fetch(`/api/competition-marks?id=${id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch marks data");
        }

        const result = await response.json();
        setMarkData(result);
      } catch (err) {
        setMarkError(t("main.error.message"));
        console.error("Error fetching marks data:", err);
      } finally {
        setIsLoadingMarks(false);
      }
    }

    // Fetch skating data if needed
    if (tab === "skating" && !skatingData && !isLoadingSkating) {
      try {
        setIsLoadingSkating(true);
        const response = await fetch(`/api/competition-skating?id=${id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch skating data");
        }

        const result = await response.json();
        setSkatingData(result);
      } catch (err) {
        setSkatingError(t("main.error.message"));
        console.error("Error fetching skating data:", err);
      } finally {
        setIsLoadingSkating(false);
      }
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);

    fetch(`/api/competition-results?id=${id}`)
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
        setError(t("main.error.message"));
        setIsLoading(false);
        console.error("Error fetching data:", err);
      });
  };

  // Group results by section
  const groupedResults = React.useMemo(() => {
    if (!data?.results) return {};

    return data.results.reduce<Record<string, Result[]>>((acc, result) => {
      const section = result.section || t("competition.otherResults");
      if (!acc[section]) {
        acc[section] = [];
      }
      acc[section].push(result);
      return acc;
    }, {});
  }, [data?.results, t]);

  // Function to generate and download CSV data
  const handleDownloadCSV = async () => {
    if (!data) {
      setError(t("main.error.message"));
      return;
    }

    try {
      // Create a download link for the complete archive
      const link = document.createElement("a");
      link.href = `/api/download-competition?id=${id}&fields=all`;
      const transliteratedTitle = transliterateHungarianToEnglish(data.title);
      link.download = `${transliteratedTitle.replace(/\s+/g, "_")}_data.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error downloading ZIP file:", err);
      setError(t("competition.downloadError") || "Error downloading ZIP file");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
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
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-2xl font-bold text-blue-900 mb-2">
                {data.title}
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-gray-700">
                    <span className="font-semibold">
                      {t("competition.date")}:{" "}
                    </span>
                    {data.date}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">
                      {t("competition.location")}:{" "}
                    </span>
                    {data.location}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">
                      {t("competition.organizer")}:{" "}
                    </span>
                    {data.organizer}
                  </p>
                  {data.organizerRepresentative && (
                    <p className="text-gray-700">
                      <span className="font-semibold">
                        {t("competition.organizerRepresentative")}:{" "}
                      </span>
                      {data.organizerRepresentative}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-gray-700">
                    <span className="font-semibold">
                      {t("competition.type")}:{" "}
                    </span>
                    {data.type}
                  </p>
                  {data.participantCount && (
                    <p className="text-gray-700">
                      <span className="font-semibold">
                        {t("competition.participantCount")}:{" "}
                      </span>
                      {data.participantCount}
                    </p>
                  )}
                  {data.commissioner && (
                    <p className="text-gray-700">
                      <span className="font-semibold">
                        {t("competition.commissioner")}:{" "}
                      </span>
                      {data.commissioner}
                    </p>
                  )}
                  {data.supervisor && (
                    <p className="text-gray-700">
                      <span className="font-semibold">
                        {t("competition.supervisor")}:{" "}
                      </span>
                      {data.supervisor}
                    </p>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => handleTabChange("results")}
                    className={`${
                      activeTab === "results"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    {t("competition.results")}
                  </button>
                  <button
                    onClick={() => handleTabChange("judges")}
                    className={`${
                      activeTab === "judges"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    {t("competition.judges")}
                  </button>
                  <button
                    onClick={() => handleTabChange("marks")}
                    className={`${
                      activeTab === "marks"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    {t("competition.marks")}
                  </button>
                  <button
                    onClick={() => handleTabChange("skating")}
                    className={`${
                      activeTab === "skating"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    {t("competition.skating")}
                  </button>
                  <button
                    onClick={() => handleTabChange("download")}
                    className={`${
                      activeTab === "download"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    {t("competition.download") || "Download ZIP Archive"}
                  </button>
                </nav>
              </div>

              {/* Results Tab */}
              {activeTab === "results" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    {t("competition.results")}
                  </h2>

                  {data.results && data.results.length > 0 ? (
                    <>
                      <div className="mb-6">
                        <a
                          href={`/api/download-competition?id=${id}&fields=results`}
                          className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors"
                          download
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          {t("competition.downloadResultsOnly") ||
                            "Download Results Only"}
                        </a>
                      </div>
                      <div className="space-y-8">
                        {Object.entries(groupedResults).map(
                          ([section, results]) => (
                            <div key={section} className="mb-6">
                              <h3 className="text-lg font-medium text-blue-800 mb-3 italic">
                                {section}
                              </h3>
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                      >
                                        {t("competition.position")}
                                      </th>
                                      <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                      >
                                        {t("competition.number")}
                                      </th>
                                      <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                      >
                                        {t("competition.name")}
                                      </th>
                                      <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                      >
                                        {t("competition.club")}
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {results.map((result, index) => (
                                      <tr
                                        key={index}
                                        className={
                                          index % 2 === 0
                                            ? "bg-white"
                                            : "bg-gray-50"
                                        }
                                      >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                          {result.position}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                          {result.number}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                          {result.profileLink ? (
                                            <Link
                                              href={`/participants/${
                                                result.profileLink.split("=")[1]
                                              }`}
                                              className="text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                              {result.name}
                                            </Link>
                                          ) : (
                                            result.name
                                          )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                          {result.club}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500 italic">
                      {t("competition.noResults")}
                    </p>
                  )}
                </div>
              )}

              {/* Judges Tab */}
              {activeTab === "judges" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    {t("competition.judges")}
                  </h2>

                  {data.judges && data.judges.length > 0 ? (
                    <>
                      <div className="mb-6">
                        <a
                          href={`/api/download-competition?id=${id}&fields=judges,info`}
                          className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors"
                          download
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          {t("competition.downloadJudgesInfo") ||
                            "Download Judges & Officials"}
                        </a>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <h3 className="text-lg font-medium text-gray-800 mb-2">
                            {t("competition.scoringJudges")}
                          </h3>
                          <ul className="space-y-2">
                            {data.judges.map((judge, index) => (
                              <li key={index} className="text-gray-700">
                                {judge.link ? (
                                  <Link
                                    href={`/participants/${
                                      judge.link.split("=")[1]
                                    }`}
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                  >
                                    {judge.name}
                                  </Link>
                                ) : (
                                  judge.name
                                )}{" "}
                                <span className="text-gray-500">
                                  ({judge.location})
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          {data.commissioner && (
                            <div className="mb-4">
                              <h3 className="text-lg font-medium text-gray-800 mb-2">
                                {t("competition.commissioner")}
                              </h3>
                              <p className="text-gray-700">
                                {data.commissioner}
                              </p>
                            </div>
                          )}

                          {data.supervisor && (
                            <div className="mb-4">
                              <h3 className="text-lg font-medium text-gray-800 mb-2">
                                {t("competition.supervisor")}
                              </h3>
                              <p className="text-gray-700">{data.supervisor}</p>
                            </div>
                          )}

                          {data.announcer && (
                            <div className="mb-4">
                              <h3 className="text-lg font-medium text-gray-800 mb-2">
                                {t("competition.announcer")}
                              </h3>
                              <p className="text-gray-700">{data.announcer}</p>
                            </div>
                          )}

                          {data.counters && data.counters.length > 0 && (
                            <div>
                              <h3 className="text-lg font-medium text-gray-800 mb-2">
                                {t("competition.counters")}
                              </h3>
                              <p className="text-gray-700">
                                {data.counters.join(", ")}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500 italic">
                      {t("competition.noJudges")}
                    </p>
                  )}
                </div>
              )}

              {/* Marks Tab (X-ek) */}
              {activeTab === "marks" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    {t("competition.marks")}
                  </h2>

                  {isLoadingMarks && (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  )}

                  {markError && (
                    <div
                      className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6"
                      role="alert"
                    >
                      <strong className="font-bold">
                        {t("main.error.title")}{" "}
                      </strong>
                      <span className="block sm:inline">{markError}</span>
                    </div>
                  )}

                  {!isLoadingMarks && !markError && markData && (
                    <>
                      <div className="mb-6">
                        <a
                          href={`/api/download-competition?id=${id}&fields=marks`}
                          className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors"
                          download
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          {t("competition.downloadMarksOnly") ||
                            "Download Marks Only"}
                        </a>
                      </div>
                      <div className="space-y-8">
                        {markData.sections.map((section, sectionIndex) => (
                          <div key={sectionIndex} className="mb-6">
                            <h3 className="text-lg font-medium text-blue-800 mb-3">
                              {section.title}
                            </h3>
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    {section.headers.map((header, idx) => (
                                      <th
                                        key={idx}
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                      >
                                        {header}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {section.rows.map((row, rowIndex) => (
                                    <tr
                                      key={rowIndex}
                                      className={
                                        rowIndex % 2 === 0
                                          ? "bg-white"
                                          : "bg-gray-50"
                                      }
                                    >
                                      {section.headers.map(
                                        (header, cellIndex) => (
                                          <td
                                            key={cellIndex}
                                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                          >
                                            {row[header]}
                                          </td>
                                        )
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}

                        {markData.sections.length === 0 && (
                          <p className="text-gray-500 italic">
                            {t("competition.noMarks")}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Skating Tab */}
              {activeTab === "skating" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    {t("competition.skating")}
                  </h2>

                  {isLoadingSkating && (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  )}

                  {skatingError && (
                    <div
                      className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6"
                      role="alert"
                    >
                      <strong className="font-bold">
                        {t("main.error.title")}{" "}
                      </strong>
                      <span className="block sm:inline">{skatingError}</span>
                    </div>
                  )}

                  {!isLoadingSkating && !skatingError && skatingData && (
                    <>
                      <div className="mb-6">
                        <a
                          href={`/api/download-competition?id=${id}&fields=skating`}
                          className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors"
                          download
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          {t("competition.downloadSkatingOnly") ||
                            "Download Skating Only"}
                        </a>
                      </div>
                      <div className="space-y-8">
                        {skatingData.sections.map((section, sectionIndex) => (
                          <div key={sectionIndex} className="mb-6">
                            <h3 className="text-lg font-medium text-blue-800 mb-3">
                              {section.title}
                            </h3>
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    {section.headers.map((header, idx) => (
                                      <th
                                        key={idx}
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                      >
                                        {header}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {section.rows.map((row, rowIndex) => (
                                    <tr
                                      key={rowIndex}
                                      className={
                                        rowIndex % 2 === 0
                                          ? "bg-white"
                                          : "bg-gray-50"
                                      }
                                    >
                                      {section.headers.map(
                                        (header, cellIndex) => (
                                          <td
                                            key={cellIndex}
                                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                          >
                                            {row[header]}
                                          </td>
                                        )
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}

                        {skatingData.sections.length === 0 && (
                          <p className="text-gray-500 italic">
                            {t("competition.noSkating")}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Download CSV Tab */}
              {activeTab === "download" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    {t("competition.download") || "Download Competition Data"}
                  </h2>

                  <p className="text-gray-700 mb-4">
                    {t("competition.downloadDescription") ||
                      "Download the complete competition data or select specific data categories to include in your download."}
                  </p>

                  {!isLoadingMarks && (
                    <div className="mb-6 space-y-4">
                      <button
                        onClick={handleDownloadCSV}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors flex items-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        {t("competition.downloadZIP") ||
                          "Download Complete ZIP Archive"}
                      </button>

                      <div className="mt-4">
                        <h3 className="text-lg font-medium text-gray-800 mb-2">
                          {t("competition.downloadCustom") ||
                            "Custom Downloads:"}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <a
                            href={`/api/download-competition?id=${id}&fields=marks,results`}
                            className="inline-flex items-center bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-4 rounded transition-colors"
                            download
                          >
                            {t("competition.downloadMarksResults") ||
                              "Marks & Results"}
                          </a>
                          <a
                            href={`/api/download-competition?id=${id}&fields=judges,info`}
                            className="inline-flex items-center bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-4 rounded transition-colors"
                            download
                          >
                            {t("competition.downloadJudgesInfo") ||
                              "Judges & Officials"}
                          </a>
                          <a
                            href={`/api/download-competition?id=${id}&fields=results,skating`}
                            className="inline-flex items-center bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-4 rounded transition-colors"
                            download
                          >
                            {t("competition.downloadResultsSkating") ||
                              "Results & Skating"}
                          </a>
                          <a
                            href={`/api/download-competition?id=${id}&fields=info`}
                            className="inline-flex items-center bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-4 rounded transition-colors"
                            download
                          >
                            {t("competition.downloadInfoOnly") ||
                              "Competition Info Only"}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                      {t("competition.zipContents") ||
                        "Available Download Categories:"}
                    </h3>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li>
                        {t("competition.competitionDetails") ||
                          "Competition details (info)"}
                      </li>
                      <li>
                        {t("competition.judgesFile") ||
                          "Judges information (judges)"}
                      </li>
                      <li>
                        {t("competition.resultsFiles") ||
                          "Results by category (results)"}
                      </li>
                      <li>
                        {t("competition.marksFiles") ||
                          "Marks data - X-es (marks)"}
                      </li>
                      <li>
                        {t("competition.skatingFiles") ||
                          "Skating data (skating)"}
                      </li>
                    </ul>
                  </div>
                </div>
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
