import React from "react";
import PreviousCompetitionCard from "./PreviousCompetitionCard";
import UpcomingCompetitionCard from "./UpcomingCompetitionCard";
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
  id?: string;
  organizer?: string;
  deadline?: string;
  information?: string;
};

type MonthSectionProps = {
  name: string;
  competitions: Competition[];
};

const MonthSection = ({ name, competitions }: MonthSectionProps) => {
  const { t } = useLanguage();

  // Helper to determine if a competition is upcoming based on presence of upcoming-specific fields
  const isUpcomingCompetition = (competition: Competition): boolean => {
    return (
      competition.organizer !== undefined || competition.deadline !== undefined
    );
  };

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
          {competitions.map((competition, index) => {
            return isUpcomingCompetition(competition) ? (
              <UpcomingCompetitionCard
                key={`comp-${index}`}
                date={competition.date}
                title={competition.title}
                location={competition.location}
                categories={competition.categories.map((cat) => cat.name)}
                url={competition.url}
                organizer={competition.organizer}
                deadline={competition.deadline}
                id={competition.id}
                information={competition.information}
              />
            ) : (
              <PreviousCompetitionCard
                key={`comp-${index}`}
                date={competition.date}
                title={competition.title}
                location={competition.location}
                categories={competition.categories}
                url={competition.url}
              />
            );
          })}
        </div>
      )}
    </section>
  );
};

export default MonthSection;
