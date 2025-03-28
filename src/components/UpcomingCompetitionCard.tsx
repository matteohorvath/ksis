import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";

type UpcomingCompetitionCardProps = {
  date: string;
  title: string;
  location: string;
  categories: string[];
  url: string;
  organizer?: string;
  deadline?: string;
};

const UpcomingCompetitionCard = ({
  date,
  title,
  location,
  categories,
  url,
  organizer,
  deadline,
}: UpcomingCompetitionCardProps) => {
  const { t } = useLanguage();

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

      {url && (
        <div className="mt-4">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            {t("components.competitionCard.viewDetails")}
          </a>
        </div>
      )}
    </div>
  );
};

export default UpcomingCompetitionCard;
