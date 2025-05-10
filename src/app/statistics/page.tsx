"use client";

import { useEffect, useState } from "react";
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

export default function Statistics() {
  const [data, setData] = useState<YearlyStats[]>([]);
  const [judgeData, setJudgeData] = useState<JudgeStats[]>([]);
  const [participantData, setParticipantData] = useState<ParticipantStats[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
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
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    getData();
  }, []);

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
