import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";

type PreviousCompetitionCardProps = {
  date: string;
  title: string;
  location: string;
  categories: string[];
  url: string;
};

const PreviousCompetitionCard = ({
  date,
  title,
  location,
  categories,
  url,
}: PreviousCompetitionCardProps) => {
  const { t } = useLanguage();

  // Check if event is in the future to disable links
  const isFutureEvent = () => {
    const [year, month, day] = date.split(".").map(Number);
    const eventDate = new Date(year, month - 1, day); // month is 0-indexed in JS Date
    return eventDate > new Date();
  };

  const isInFuture = isFutureEvent();

  const handleClick = () => {
    if (isInFuture) return; // Don't open links for future events
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isInFuture) return; // Don't handle keydown for future events
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white mb-4"
      data-testid="competition-card"
    >
      <div className="flex flex-col md:flex-row justify-between mb-2">
        <h3
          className={`text-xl font-bold ${
            isInFuture
              ? "text-gray-600"
              : "text-blue-800 cursor-pointer hover:underline"
          }`}
          onClick={isInFuture ? undefined : handleClick}
          onKeyDown={isInFuture ? undefined : handleKeyDown}
          tabIndex={isInFuture ? -1 : 0}
          aria-label={`Competition: ${title}${
            isInFuture ? ` (${t("components.competitionCard.upcoming")})` : ""
          }`}
        >
          {title}{" "}
          {isInFuture && (
            <span className="text-sm font-normal">
              ({t("components.competitionCard.upcoming")})
            </span>
          )}
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
    </div>
  );
};

export default PreviousCompetitionCard;
