"use client";

import React, { useEffect, useState } from "react";
import { Database } from "@sqlitecloud/drivers";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLanguage } from "@/i18n/LanguageContext";
import Navbar from "@/components/Navbar";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

interface YearlyStats {
  year: string;
  count: number;
}

interface JudgeStats {
  name: string;
  count: number;
}

interface ParticipantStats {
  name: string;
  count: number;
}

interface JudgeAccuracyStats {
  judgeName: string;
  averageDeviation: number;
  absoluteDeviation: number;
  bias: number;
  totalMarks: number;
  accuracyScore: number;
}

type SortField =
  | "judgeName"
  | "accuracyScore"
  | "absoluteDeviation"
  | "bias"
  | "totalMarks";
type SortDirection = "asc" | "desc";

export default function Statistics() {
  const [data, setData] = useState<YearlyStats[]>([]);
  const [judgeData, setJudgeData] = useState<JudgeStats[]>([]);
  const [participantData, setParticipantData] = useState<ParticipantStats[]>(
    []
  );
  const [judgeAccuracyData, setJudgeAccuracyData] = useState<
    JudgeAccuracyStats[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // New state for table functionality
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("accuracyScore");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const { t } = useLanguage();
  const db = new Database(process.env.NEXT_PUBLIC_DB_STRING!);

  useEffect(() => {
    const getData = async () => {
      try {
        const yearlyResult = await db.sql`
          SELECT 
            substr(Competition.date, 1, 4) as year,
            COUNT(Event.id) as count
          FROM Competition 
          LEFT JOIN Event ON Competition.id = Event.competitionId
          WHERE Competition.date IS NOT NULL
          GROUP BY year
          ORDER BY year ASC;
        `;
        setData(yearlyResult);

        const judgeResult = await db.sql`
          SELECT 
            judges.name,
            COUNT(DISTINCT Event.id) as count
          FROM judges
          JOIN _EventToJudge ON judges.id = _EventToJudge.B
          JOIN Event ON _EventToJudge.A = Event.id
          GROUP BY judges.id, judges.name
          ORDER BY count DESC
          LIMIT 10;
        `;
        setJudgeData(judgeResult);

        const participantResult = await db.sql`
          SELECT 
            participants.name,
            COUNT(DISTINCT Event.id) as count
          FROM participants
          JOIN Result ON participants.id = Result.participantId
          JOIN Event ON Result.eventId = Event.id
          GROUP BY participants.id, participants.name
          ORDER BY count DESC
          LIMIT 10;
        `;
        setParticipantData(participantResult);

        // New query for judges accuracy analysis
        const judgeAccuracyResult = await db.sql`
          WITH judge_deviations AS (
            SELECT 
              j.name as judge_name,
              m.proposedPlacement,
              CAST(REPLACE(r.position, '.', '') AS INTEGER) as final_position,
              (m.proposedPlacement - CAST(REPLACE(r.position, '.', '') AS INTEGER)) as deviation,
              ABS(m.proposedPlacement - CAST(REPLACE(r.position, '.', '') AS INTEGER)) as abs_deviation
            FROM Mark m
            JOIN judges j ON m.judgeId = j.id
            JOIN Result r ON m.resultId = r.id
            WHERE r.position IS NOT NULL 
              AND r.position != ''
              AND r.position LIKE '%.'
              AND m.proposedPlacement IS NOT NULL
          )
          SELECT 
            judge_name as judgeName,
            ROUND(AVG(deviation), 2) as averageDeviation,
            ROUND(AVG(abs_deviation), 2) as absoluteDeviation,
            ROUND(AVG(deviation), 2) as bias,
            COUNT(*) as totalMarks,
            ROUND((10 - AVG(abs_deviation)), 2) as accuracyScore
          FROM judge_deviations
          GROUP BY judge_name
          HAVING COUNT(*) >= 20
          ORDER BY abs_deviation ASC;
        `;
        setJudgeAccuracyData(judgeAccuracyResult);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    getData();
  }, []);

  // Filter and sort judge accuracy data
  const filteredAndSortedData = React.useMemo(() => {
    return judgeAccuracyData
      .filter((judge) =>
        judge.judgeName.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        }

        return 0;
      });
  }, [judgeAccuracyData, searchTerm, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = React.useMemo(() => {
    return filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedData, startIndex, itemsPerPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUpIcon className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDownIcon className="w-4 h-4 inline ml-1" />
    );
  };

  const totalEvents = data.reduce((sum, item) => sum + item.count, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-4 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8">
            {t("statistics.title")}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-8">
            {t("statistics.lastUpdated")} 2025.05.13.
          </p>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-4 sm:mb-8">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">
                  {t("statistics.totalEvents")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-3xl sm:text-4xl font-bold"
                >
                  {totalEvents}
                </motion.div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">
                  {t("statistics.yearsTracked")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-3xl sm:text-4xl font-bold"
                >
                  {data.length}
                </motion.div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">
                  {t("statistics.averageEventsPerYear")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-3xl sm:text-4xl font-bold"
                >
                  {(totalEvents / data.length).toFixed(1)}
                </motion.div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-4 sm:mb-8">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">
                {t("statistics.eventsPerYear")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-6">
              <div className="h-[300px] sm:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data}
                    margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="year"
                      tick={{ fontSize: 12 }}
                      tickMargin={10}
                    />
                    <YAxis tick={{ fontSize: 12 }} tickMargin={10} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-4 sm:mb-8">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">
                {t("statistics.topJudges")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-6">
              <div className="h-[300px] sm:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={judgeData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 12 }}
                      tickMargin={10}
                    />
                    <YAxis tick={{ fontSize: 12 }} tickMargin={10} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-4 sm:mb-8">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">
                {t("statistics.topParticipants")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-6">
              <div className="h-[300px] sm:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={participantData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 12 }}
                      tickMargin={10}
                    />
                    <YAxis tick={{ fontSize: 12 }} tickMargin={10} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* judges Accuracy Analysis */}
          <Card className="mb-4 sm:mb-8">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">
                Judges Accuracy Analysis
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Analysis of how well judges&apos; marks align with final
                results. Lower absolute deviation = more accurate.
              </p>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {/* Search and Info Bar */}
              <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search judges..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1}-
                  {Math.min(
                    startIndex + itemsPerPage,
                    filteredAndSortedData.length
                  )}{" "}
                  of {filteredAndSortedData.length} judges
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Rank</th>
                      <th
                        className="text-left p-2 cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => handleSort("judgeName")}
                      >
                        Judge Name <SortIcon field="judgeName" />
                      </th>
                      <th
                        className="text-center p-2 cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => handleSort("accuracyScore")}
                      >
                        Accuracy Score <SortIcon field="accuracyScore" />
                      </th>
                      <th
                        className="text-center p-2 cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => handleSort("absoluteDeviation")}
                      >
                        Avg Deviation <SortIcon field="absoluteDeviation" />
                      </th>
                      <th
                        className="text-center p-2 cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => handleSort("bias")}
                      >
                        Bias <SortIcon field="bias" />
                      </th>
                      <th
                        className="text-center p-2 cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => handleSort("totalMarks")}
                      >
                        Total Marks <SortIcon field="totalMarks" />
                      </th>
                      <th className="text-center p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((judge, index) => {
                      const globalIndex = startIndex + index;
                      const isAccurate = judge.absoluteDeviation <= 1.0;
                      const isSuspicious = judge.absoluteDeviation >= 2.5;
                      const hasStrongBias = Math.abs(judge.bias) >= 1.5;

                      return (
                        <tr
                          key={judge.judgeName}
                          className={`border-b ${
                            isSuspicious
                              ? "bg-red-50"
                              : isAccurate
                              ? "bg-green-50"
                              : ""
                          }`}
                        >
                          <td className="p-2 font-semibold">
                            {globalIndex + 1}
                          </td>
                          <td className="p-2">{judge.judgeName}</td>
                          <td className="p-2 text-center">
                            <span
                              className={`px-2 py-1 rounded ${
                                judge.accuracyScore >= 8
                                  ? "bg-green-100 text-green-800"
                                  : judge.accuracyScore >= 6
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {judge.accuracyScore}/10
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            {judge.absoluteDeviation}
                          </td>
                          <td className="p-2 text-center">
                            <span
                              className={
                                Math.abs(judge.bias) >= 1.5
                                  ? "text-red-600 font-semibold"
                                  : ""
                              }
                            >
                              {judge.bias > 0 ? "+" : ""}
                              {judge.bias}
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            {judge.totalMarks}
                          </td>
                          <td className="p-2 text-center">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                isSuspicious
                                  ? "bg-red-100 text-red-800"
                                  : hasStrongBias
                                  ? "bg-orange-100 text-orange-800"
                                  : isAccurate
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {isSuspicious
                                ? "Suspicious"
                                : hasStrongBias
                                ? "Biased"
                                : isAccurate
                                ? "Accurate"
                                : "Average"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    {/* Page numbers */}
                    <div className="flex gap-1">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-2 text-sm border rounded-lg ${
                                currentPage === pageNum
                                  ? "bg-blue-500 text-white border-blue-500"
                                  : "border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                      )}
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {judgeAccuracyData.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Legend:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <strong>Accuracy Score:</strong> 10 - average absolute
                      deviation
                    </div>
                    <div>
                      <strong>Avg Deviation:</strong> Average difference from
                      final position
                    </div>
                    <div>
                      <strong>Bias:</strong> Positive = tends to rank lower,
                      Negative = tends to rank higher
                    </div>
                    <div>
                      <strong>Status:</strong> Accurate (&lt;=1.0), Biased
                      (|bias| &gt;=1.5), Suspicious (&gt;=2.5)
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <footer className="bg-gray-100 border-t border-gray-200 py-4 sm:py-6">
        <div className="container mx-auto px-4 text-center text-gray-600 text-xs sm:text-sm">
          <p>{t("footer.copyright")}</p>
        </div>
      </footer>
    </div>
  );
}
