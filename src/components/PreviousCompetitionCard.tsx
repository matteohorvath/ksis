import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import Link from "next/link";

type Category = {
  name: string;
  url: string;
};

type PreviousCompetitionCardProps = {
  date: string;
  title: string;
  location: string;
  categories: Category[];
  url: string; // Still needed for potential future functionality and categories
};

const PreviousCompetitionCard = ({
  date,
  title,
  location,
  categories,
  url, // Keeping for categories functionality
}: PreviousCompetitionCardProps) => {
  const { t } = useLanguage();

  // Check if event is in the future to disable links
  const isFutureEvent = () => {
    const [year, month, day] = date.split(".").map(Number);
    const eventDate = new Date(year, month - 1, day); // month is 0-indexed in JS Date
    return eventDate > new Date();
  };

  const isInFuture = isFutureEvent();

  // Helper function to extract ID from URL
  const extractCategoryId = (url: string): string => {
    const idMatch = url.match(/sutaz_id=(\d+)/);
    return idMatch ? idMatch[1] : "";
  };

  return (
    <div
      className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white mb-4"
      data-testid="competition-card"
      data-competition-url={url}
    >
      <div className="flex flex-col md:flex-row justify-between mb-2">
        <h3
          className="text-xl font-bold text-blue-800"
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
            {categories.map((category, index) => {
              const categoryId = extractCategoryId(category.url);
              return categoryId ? (
                <Link
                  key={index}
                  href={`/competitions/category/${categoryId}`}
                  className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm hover:bg-blue-200 transition-colors"
                >
                  {category.name}
                </Link>
              ) : (
                <a
                  key={index}
                  href={category.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm hover:bg-blue-200 transition-colors"
                >
                  {category.name}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviousCompetitionCard;
