import React, { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import Link from "next/link";

type CompetitionInfoData = {
  title: string;
  date: string;
  location: string;
  info: string;
  organizer?: string;
  organizerAddress?: string;
  organizerPhone?: string;
  organizerEmail?: string;
  organizerWebsite?: string;
  representative?: string;
  deadline?: string;
  venueCapacity?: string;
  danceFloorSize?: string;
  danceFloorSurface?: string;
  entranceFee?: string;
  awards?: string;
  notes?: string;
};

type UpcomingCompetitionCardProps = {
  date: string;
  title: string;
  location: string;
  categories: string[];
  url: string;
  organizer?: string;
  deadline?: string;
  id?: string;
  information?: string;
};

const UpcomingCompetitionCard = ({
  date,
  title,
  location,
  categories,
  url,
  organizer,
  deadline,
  id,
}: UpcomingCompetitionCardProps) => {
  const { t } = useLanguage();
  const [showInfo, setShowInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [infoData, setInfoData] = useState<CompetitionInfoData | null>(null);

  const fetchInfoData = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/competition-info?id=${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch competition info");
      }

      const data = await response.json();
      setInfoData(data);
    } catch (error) {
      console.error("Error fetching competition info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInfoClick = () => {
    if (!showInfo && !infoData) {
      fetchInfoData();
    }
    setShowInfo(!showInfo);
  };

  return (
    <div
      className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white mb-4"
      data-testid="competition-card"
    >
      <div className="flex flex-col md:flex-row justify-between mb-2">
        <h3
          className="text-xl font-bold text-blue-800"
          aria-label={`Competition: ${title}`}
        >
          {title}
        </h3>
        <span className="font-semibold text-gray-700">{date}</span>
      </div>

      {location && (
        <div className="mb-3 text-gray-600">
          <span className="font-medium">
            {t("components.competitionCard.location")}{" "}
          </span>
          {location}
        </div>
      )}

      {organizer && (
        <div className="mb-3 text-gray-600">
          <span className="font-medium">
            {t("components.competitionCard.organizer")}{" "}
          </span>
          {organizer}
        </div>
      )}

      {deadline && (
        <div className="mb-3 text-gray-600">
          <span className="font-medium">
            {t("components.competitionCard.deadline")}{" "}
          </span>
          {deadline}
        </div>
      )}

      {/* Information section */}
      {showInfo && (
        <div className="my-3 p-3 bg-gray-50 rounded-md border border-gray-200">
          {isLoading ? (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : infoData ? (
            <div>
              {/* Organization section */}
              {infoData.organizer && (
                <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-100">
                  <h4 className="font-medium text-gray-800 mb-2">
                    {t("components.competitionCard.responsibleOrganization")}
                  </h4>
                  <div className="text-gray-700">
                    <p className="font-semibold">{infoData.organizer}</p>
                    {infoData.organizerAddress && (
                      <p>{infoData.organizerAddress}</p>
                    )}
                    {infoData.organizerPhone && (
                      <p>{infoData.organizerPhone}</p>
                    )}
                    {infoData.organizerEmail && (
                      <p>
                        <a
                          href={`mailto:${infoData.organizerEmail}`}
                          className="text-blue-600 hover:underline"
                        >
                          {infoData.organizerEmail}
                        </a>
                      </p>
                    )}
                    {infoData.organizerWebsite && (
                      <p>
                        <a
                          href={
                            infoData.organizerWebsite.startsWith("http")
                              ? infoData.organizerWebsite
                              : `http://${infoData.organizerWebsite}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {infoData.organizerWebsite}
                        </a>
                      </p>
                    )}
                  </div>
                  {infoData.representative && (
                    <div className="mt-2">
                      <span className="font-medium">
                        {t("components.competitionCard.representative")}:{" "}
                      </span>{" "}
                      {infoData.representative}
                    </div>
                  )}
                </div>
              )}

              {infoData.info && (
                <div className="mb-3">
                  <h4 className="font-medium text-gray-700 mb-1">
                    {t("components.competitionCard.information")}
                  </h4>
                  <div className="text-gray-600 whitespace-pre-line">
                    {infoData.info}
                  </div>
                </div>
              )}

              {infoData.venueCapacity && (
                <div className="text-gray-600 mb-2">
                  <span className="font-medium">
                    {t("components.competitionCard.venueCapacity")}:{" "}
                  </span>
                  {infoData.venueCapacity}
                </div>
              )}

              {infoData.danceFloorSize && (
                <div className="text-gray-600 mb-2">
                  <span className="font-medium">
                    {t("components.competitionCard.danceFloorSize")}:{" "}
                  </span>
                  {infoData.danceFloorSize}
                </div>
              )}

              {infoData.danceFloorSurface && (
                <div className="text-gray-600 mb-2">
                  <span className="font-medium">
                    {t("components.competitionCard.danceFloorSurface")}:{" "}
                  </span>
                  {infoData.danceFloorSurface}
                </div>
              )}

              {infoData.entranceFee && (
                <div className="text-gray-600 mb-2">
                  <span className="font-medium">
                    {t("components.competitionCard.entranceFee")}:{" "}
                  </span>
                  {infoData.entranceFee}
                </div>
              )}

              {infoData.awards && (
                <div className="text-gray-600 mb-2">
                  <span className="font-medium">
                    {t("components.competitionCard.awards")}:{" "}
                  </span>
                  {infoData.awards}
                </div>
              )}

              {infoData.notes && (
                <div className="text-gray-600 mb-2">
                  <span className="font-medium">
                    {t("components.competitionCard.notes")}:{" "}
                  </span>
                  <div className="whitespace-pre-line">{infoData.notes}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-600">
              {t("components.competitionCard.infoNotAvailable")}
            </div>
          )}
        </div>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <div className="mt-3">
          <h4 className="font-medium text-gray-700 mb-2">
            {t("components.competitionCard.categories")}
          </h4>
          <div className="flex flex-wrap gap-2">
            {categories.map((category, index) => (
              <span
                key={index}
                className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            {t("components.competitionCard.viewDetails")}
          </a>
        )}

        {id && (
          <>
            <Link
              href={`/competitions/participants?id=${id}`}
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              {t("components.competitionCard.viewParticipants") ||
                "View Participants"}
            </Link>

            <button
              onClick={handleInfoClick}
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded transition-colors"
              aria-expanded={showInfo}
            >
              {showInfo
                ? t("components.competitionCard.hideInfo")
                : t("components.competitionCard.showInfo")}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default UpcomingCompetitionCard;
