import { api } from "@/utils/api";
import { type Competition } from "@prisma/client";

import Nav from "@/components/nav/nav";
import { ArchiveCompetitionCard } from "@/components/competition/competiton";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const limit = useRef(3);
  const [loading, setLoading] = useState(true);

  const comps: Competition[] =
    api.competition.getAllPrevious.useQuery().data ?? [];

  useEffect(() => {
    if (loading && comps.length > limit.current) {
      setLoading(false);
    }
  }, [comps.length, loading]);
  return (
    <div>
      <Nav />

      <div className="grid gap-4 px-10 sm:grid-cols-2 sm:px-20 md:px-40 lg:grid-cols-3">
        {comps.map((comp) => (
          <ArchiveCompetitionCard competition={comp} key={comp.id} />
        ))}
      </div>
    </div>
  );
}
