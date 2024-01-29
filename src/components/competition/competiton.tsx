import { type Competition } from "@prisma/client";
import Link from "next/link";

export default function CompetitionCard({
  competition,
}: {
  competition: Competition;
}) {
  return (
    <div className="rounded-xl border-2 border-[#222222] p-4 shadow-2xl dark:border-[#FAFAFA]">
      <div className="text-2xl font-bold">
        <DisplayDate date={competition.date ?? new Date()} />
      </div>
      <div>{competition.title}</div>
      <Link
        href={`https://www.google.com/maps/search/?api=1&query=${competition.place?.replace(" ", "+") ?? competition.place}`}
        passHref
      >
        <Link
          href={`https://maps.apple.com/maps?q=${competition.place?.replace(" ", "+") ?? competition.place}`}
        >
          <div className="rounded-lg bg-blue-100 p-2 underline">
            {competition.place}
          </div>
        </Link>
      </Link>
      <div className="text-sm text-gray-500">{competition.organiser}</div>
    </div>
  );
}

export function ArchiveCompetitionCard({
  competition,
}: {
  competition: Competition;
}) {
  return (
    <div className="rounded-xl border-2 border-[#222222] p-4 shadow-2xl dark:border-[#FAFAFA]">
      <div className="text-2xl font-bold">
        <DisplayDate date={competition.date ?? new Date()} />
      </div>
      <div>{competition.title}</div>
      <div className="text-pink-500">{competition.place}</div>
      <div>{competition.organiser}</div>
    </div>
  );
}

function DisplayDate({ date }: { date: Date }) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return <div>{`${year}. ${month}. ${day}.`}</div>;
}
