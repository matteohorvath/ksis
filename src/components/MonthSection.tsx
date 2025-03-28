import React from "react";
import CompetitionCard from "./CompetitionCard";
import { useLanguage } from "@/i18n/LanguageContext";

type Category = {
  name: string;
  url: string;
};

type Competition = {
  date: string;
  title: string;
  location: string;
  categories: Category[];
  url: string;
  organizer?: string;
  deadline?: string;
  exactLocation?: string;
};

type MonthSectionProps = {
  name: string;
  competitions: Competition[];
};

const MonthSection = ({ name, competitions }: MonthSectionProps) => {
  const { t } = useLanguage();

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-blue-900 mb-4 pb-2 border-b border-gray-200">
        {name}
      </h2>

      {competitions.length === 0 ? (
        <p className="text-gray-500 italic">
          {t("components.monthSection.noCompetitions")}
        </p>
      ) : (
        <div className="space-y-4">
          {competitions.map((competition, index) => (
            <CompetitionCard
              key={index}
              date={competition.date}
              title={competition.title}
              location={competition.location}
              categories={competition.categories}
              url={competition.url}
              organizer={competition.organizer}
              deadline={competition.deadline}
              exactLocation={competition.exactLocation}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default MonthSection;
