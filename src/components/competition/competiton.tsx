import { formatString } from "@/lib/utils";
import { type Competition } from "@prisma/client";
import Link from "next/link";

export default function CompetitionCard({
  competition,
}: {
  competition: Competition;
}) {
  return (
    <div className=" rounded-lg border-2 border-[#222222]  shadow-xl dark:border-[#FAFAFA]">
      <div className="grid grid-cols-[3fr_1fr]">
        <div className="p-2 text-sm text-gray-500">{competition.organiser}</div>
        <div className="rounded-bl-lg rounded-tr-lg border-b-2 border-l-2 border-black bg-green-100 p-2 text-right font-bold">
          <DisplayDate date={competition.date ?? new Date()} />
        </div>
      </div>

      <div className="p-2">{formatString(competition.title ?? "", 40)}</div>

      <Link
        href={`https://www.google.com/maps/search/?api=1&query=${competition.place?.replace(" ", "+") ?? competition.place}`}
        passHref
        target="_blank"
      >
        <div className="rounded-lg  p-2 underline">{competition.place}</div>
      </Link>
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
      <div className="text-gray-500">{competition.place}</div>
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
