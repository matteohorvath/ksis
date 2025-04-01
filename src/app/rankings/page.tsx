"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";
import Navbar from "@/components/Navbar";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

type Dancer = {
  name: string;
  club: string;
  url: string;
};

type RankingEntry = {
  position: string;
  dancers: Dancer;
  competitions: {
    [key: string]: string;
  };
  wdsf: string;
  national: string;
  points: string;
};

type Competition = {
  name: string;
  location: string;
  date: string;
  url: string;
};

type RankingData = {
  date: string;
  ageGroup: string;
  danceType: string;
  competitions: Competition[];
  rankings: RankingEntry[];
};

export default function RankingsPage() {
  const { t } = useLanguage();
  const [rankings, setRankings] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  // Filter states
  const [date, setDate] = useState("2025.03.28");
  const [ageGroup, setAgeGroup] = useState("FLN");
  const [danceType, setDanceType] = useState("L");

  // Load rankings data
  const fetchRankings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/rankings?dt_od=${date}&evkor=${ageGroup}&s_l=${danceType}`
      );

      if (!response.ok) {
        throw new Error(`Error fetching rankings: ${response.statusText}`);
      }

      const data = await response.json();
      setRankings(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load rankings data"
      );
      console.error("Error fetching rankings:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchRankings();
  }, []);

  // Handle form submission
  const handleFilterChange = () => {
    fetchRankings();
  };

  const toggleExpandCard = (index: number) => {
    setExpandedCard(expandedCard === index ? null : index);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto p-4">{t("main.loading")}</div>
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto p-4 text-red-500">
          {t("main.error.title")} {error}
        </div>
      </div>
    );
  if (!rankings)
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto p-4">{t("main.noData")}</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">{t("navigation.rankings")}</h1>

        {/* Filter form */}
        <div className="bg-gray-100 p-4 rounded mb-6">
          <h2 className="text-lg font-semibold mb-2">
            {t("navigation.rankings")}
          </h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col">
              <label htmlFor="date" className="mb-1 text-sm">
                {t("rankings.date")}
              </label>
              <input
                type="date"
                id="date"
                value={date.split(".").join("-")}
                onChange={(e) => {
                  // Convert from YYYY-MM-DD to YYYY.MM.DD format
                  const newDate = e.target.value.split("-").join(".");
                  setDate(newDate);
                }}
                className="border rounded p-1"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="ageGroup" className="mb-1 text-sm">
                {t("rankings.ageGroup")}
              </label>
              <select
                id="ageGroup"
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                className="border rounded p-1"
              >
                <option value="FLN">{t("rankings.ageGroups.FLN")}</option>
                <option value="IFI">{t("rankings.ageGroups.IFI")}</option>
                <option value="JN1">{t("rankings.ageGroups.JN1")}</option>
                <option value="JN2">{t("rankings.ageGroups.JN2")}</option>
                <option value="SE1">{t("rankings.ageGroups.SE1")}</option>
                <option value="SE2">{t("rankings.ageGroups.SE2")}</option>
                <option value="SE3">{t("rankings.ageGroups.SE3")}</option>
                <option value="SE4">{t("rankings.ageGroups.SE4")}</option>
                <option value="PD">{t("rankings.ageGroups.PD")}</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label htmlFor="danceType" className="mb-1 text-sm">
                {t("rankings.danceType")}
              </label>
              <select
                id="danceType"
                value={danceType}
                onChange={(e) => setDanceType(e.target.value)}
                className="border rounded p-1"
              >
                <option value="S">{t("rankings.danceTypes.S")}</option>
                <option value="L">{t("rankings.danceTypes.L")}</option>
                <option value="T">{t("rankings.danceTypes.T")}</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleFilterChange}
                className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
              >
                {t("rankings.filter")}
              </button>
            </div>
          </div>
        </div>

        {/* Current filter information */}
        <div className="mb-6">
          <h2 className="text-xl font-bold">
            {rankings.date} • {rankings.ageGroup} • {rankings.danceType}
          </h2>
        </div>

        {/* Desktop view: Rankings table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full bg-white border border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-center w-16 font-bold">
                  {t("rankings.position")}
                </th>
                <th className="border p-2 text-left font-bold">
                  {t("rankings.dancer")}
                </th>

                {/* Competition columns */}
                {rankings.competitions.map((comp, index) => (
                  <th
                    key={index}
                    className="border p-2 text-center w-28 text-sm"
                  >
                    <Link
                      href={comp.url}
                      className="text-blue-500 hover:underline"
                      target="_blank"
                    >
                      {comp.name}
                      <br />
                      {comp.location}
                      <br />
                      {comp.date}
                    </Link>
                  </th>
                ))}

                <th className="border p-2 text-center w-28 font-bold">
                  {t("rankings.homelandWDSF")}
                </th>
                <th className="border p-2 text-center w-28 font-bold">
                  {t("rankings.nationalChampionship")}
                </th>
                <th className="border p-2 text-center w-20 font-bold">
                  {t("rankings.points")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rankings.rankings.map((entry, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                  <td className="border p-2 text-center font-semibold">
                    {entry.position}
                  </td>
                  <td className="border p-2">
                    <a
                      href={entry.dancers.url}
                      className="text-blue-500 hover:underline"
                      target="_blank"
                    >
                      {entry.dancers.name}
                    </a>
                    <br />
                    <span className="text-sm text-gray-600">
                      {entry.dancers.club}
                    </span>
                  </td>

                  {/* Competition results */}
                  {rankings.competitions.map((_, i) => {
                    const value = entry.competitions[i.toString()] || "";
                    const isGrayedOut =
                      value.includes("(") &&
                      value.includes(")") &&
                      value.includes("i");

                    return (
                      <td key={i} className="border p-2 text-center text-sm">
                        {isGrayedOut ? (
                          <span className="text-gray-400 italic">{value}</span>
                        ) : (
                          <span>{value}</span>
                        )}
                      </td>
                    );
                  })}

                  <td className="border p-2 text-center">{entry.wdsf || ""}</td>
                  <td className="border p-2 text-center">
                    {entry.national || ""}
                  </td>
                  <td className="border p-2 text-center font-bold">
                    {entry.points || ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile view: Card layout */}
        <div className="md:hidden space-y-4">
          {rankings.rankings.map((entry, index) => (
            <div key={index} className="bg-white rounded-lg shadow border">
              {/* Card header - always visible */}
              <div className="flex items-center p-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 font-bold mr-3">
                  {entry.position}
                </div>
                <div className="flex-grow">
                  <a
                    href={entry.dancers.url}
                    className="text-blue-600 font-semibold hover:underline"
                    target="_blank"
                  >
                    {entry.dancers.name}
                  </a>
                  <p className="text-sm text-gray-600">{entry.dancers.club}</p>
                </div>
                <div className="text-center px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg">
                  <span className="font-bold text-blue-800">
                    {entry.points || "0"}
                  </span>
                  <span className="text-xs block text-gray-500">
                    {t("rankings.points")}
                  </span>
                </div>
                <button
                  className="ml-2 p-1"
                  onClick={() => toggleExpandCard(index)}
                  aria-label={expandedCard === index ? "Collapse" : "Expand"}
                >
                  {expandedCard === index ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>

              {/* Expandable card content */}
              {expandedCard === index && (
                <div className="border-t border-gray-100 pt-2">
                  <div className="px-3 pb-3">
                    {/* Competition results section header */}
                    <div className="text-sm text-gray-500 mb-2">
                      {t("rankings.competitionResults")}
                    </div>

                    {/* Competition results list */}
                    <div className="space-y-2">
                      {rankings.competitions.map((comp, i) => {
                        const value = entry.competitions[i.toString()] || "";
                        const isGrayedOut =
                          value.includes("(") &&
                          value.includes(")") &&
                          value.includes("i");

                        return (
                          <div
                            key={i}
                            className="flex items-center justify-between pb-2 border-b border-gray-100 last:border-0"
                          >
                            <div className="flex-grow pr-2">
                              <Link
                                href={comp.url}
                                className="text-blue-500 text-sm hover:underline"
                                target="_blank"
                              >
                                {comp.name} {comp.location} {comp.date}
                              </Link>
                            </div>
                            <div className="flex-shrink-0 font-medium text-right">
                              {isGrayedOut ? (
                                <span className="text-gray-400 italic">
                                  {value}
                                </span>
                              ) : (
                                <span>{value}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Additional info */}
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="bg-gray-50 p-2 rounded border">
                        <div className="text-xs text-gray-500">
                          {t("rankings.homelandWDSF")}
                        </div>
                        <div className="font-medium">{entry.wdsf || "-"}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded border">
                        <div className="text-xs text-gray-500">
                          {t("rankings.nationalChampionship")}
                        </div>
                        <div className="font-medium">
                          {entry.national || "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 text-sm text-gray-500">
          {t("rankings.dataSource")}{" "}
          <a
            href="https://ksis.szts.sk/mtasz/slp_poradie.php"
            className="text-blue-500 hover:underline"
          >
            KSIS
          </a>
        </div>
      </main>

      <footer className="bg-gray-100 border-t border-gray-200 py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>{t("footer.copyright")}</p>
        </div>
      </footer>
    </div>
  );
}
