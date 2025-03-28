import React from "react";

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
};

const CompetitionCard = ({
  date,
  title,
  location,
  categories,
  url,
}: CompetitionCardProps) => {
  const handleClick = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
          className="text-xl font-bold text-blue-800 cursor-pointer hover:underline"
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          aria-label={`Competition: ${title}`}
        >
          {title}
        </h3>
        <span className="font-semibold text-gray-700">{date}</span>
      </div>

      {location && (
        <div className="mb-3 text-gray-600">
          <span className="font-medium">Location: </span>
          {location}
        </div>
      )}

      {categories.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Categories:</h4>
          <div className="flex flex-wrap gap-2">
            {categories.map((category, index) => (
              <a
                key={index}
                href={category.url}
                className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-sm hover:bg-blue-200 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={0}
                aria-label={`Category: ${category.name}`}
              >
                {category.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitionCard;
