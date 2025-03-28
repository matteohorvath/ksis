import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";

type Category = {
  name: string;
  url: string;
};

type CompetitionCardProps = {
  date: string;
  title: string;
  location: string;
  categories: Category[];
  url: string;
  organizer?: string;
  deadline?: string;
  exactLocation?: string;
};

const CompetitionCard = ({
  date,
  title,
  location,
  categories,
  url,
  organizer,
  deadline,
  exactLocation,
}: CompetitionCardProps) => {
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

      {/* Show additional details for upcoming events */}
      {isInFuture && (
        <div className="space-y-3 mt-3 border-t border-gray-100 pt-3">
          {organizer && (
            <div className="text-gray-600">
              <span className="font-medium">
                {t("components.competitionCard.organizer")}{" "}
              </span>
              {organizer}
            </div>
          )}

          {exactLocation && (
            <div className="text-gray-600">
              <span className="font-medium">
                {t("components.competitionCard.exactLocation")}{" "}
              </span>
              {exactLocation}
            </div>
          )}

          {deadline && (
            <div className="text-gray-600">
              <span className="font-medium">
                {t("components.competitionCard.registrationDeadline")}{" "}
              </span>
              <span className="text-red-600 font-semibold">{deadline}</span>
            </div>
          )}
        </div>
      )}

      {categories.length > 0 && (
        <div className="mt-3">
          <h4 className="font-medium text-gray-700 mb-2">
            {t("components.competitionCard.categories")}
          </h4>
          <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ${
              isInFuture ? "mb-2" : ""
            }`}
          >
            {categories.map((category, index) =>
              isInFuture ? (
                <div
                  key={index}
                  className="flex flex-col border border-green-200 rounded-md overflow-hidden"
                >
                  <span
                    className="bg-green-100 text-green-700 px-3 py-2 text-sm font-medium truncate"
                    aria-label={`${t(
                      "components.competitionCard.categories"
                    )} ${category.name} (${t(
                      "components.competitionCard.upcoming"
                    )})`}
                    title={category.name}
                  >
                    {category.name}
                  </span>
                  <a
                    href={category.url}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-center py-1 text-xs font-medium transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("components.competitionCard.registerNow")}
                  </a>
                </div>
              ) : (
                <a
                  key={index}
                  href={category.url}
                  className="inline-block bg-blue-100 text-blue-700 px-3 py-2 rounded-md text-sm hover:bg-blue-200 transition-colors truncate"
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={0}
                  aria-label={`${t("components.competitionCard.categories")} ${
                    category.name
                  }`}
                  title={category.name}
                >
                  {category.name}
                </a>
              )
            )}
          </div>
          {isInFuture && (
            <p className="text-sm text-gray-500 italic mt-1">
              {t("components.competitionCard.registrationLinks")}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CompetitionCard;
