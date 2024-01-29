import { api } from "@/utils/api";
import { type Competition } from "@prisma/client";

import Nav from "@/components/nav/nav";
import { useEffect, useRef, useState } from "react";
import CompetitionCard from "@/components/competition/competiton";

export default function Home() {
  const limit = useRef(3);
  const [loading, setLoading] = useState(true);
  const comps: Competition[] =
    api.competition.getAllUpcoming.useQuery().data ?? [];

  useEffect(() => {
    if (loading && comps.length > limit.current) {
      setLoading(false);
    }
  }, [comps.length, loading]);
  return (
    <div>
      <Nav />
      <div className="grid gap-4 px-10 sm:grid-cols-2 sm:px-20 md:px-40 lg:grid-cols-3">
        {loading ? (
          <div className="text-center">Betöltés...</div>
        ) : (
          comps.map((comp) => (
            <CompetitionCard competition={comp} key={comp.id} />
          ))
        )}
      </div>
    </div>
  );
}
