import { api } from "@/utils/api";
import { type Competition } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Nav from "@/components/nav/nav";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const limit = useRef(3);
  const [loading, setLoading] = useState(false);
  const comps: Competition[] =
    api.competition.getAllUpcoming.useQuery().data ?? [];

  useEffect(() => {
    if (comps.length !== limit.current) {
      setLoading(true);
    }
  }, [comps.length]);
  return (
    <div>
      <Nav />
      <div className="px-40">
        <Table>
          <TableCaption>Next competitions </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Title</TableHead>
              <TableHead>Place</TableHead>
              <TableHead>Organiser</TableHead>
              <TableHead className="text-right">Deadline</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comps.map((comp) => (
              <TableRow key={comp.id}>
                <TableCell>{comp.title}</TableCell>
                <TableCell>{comp.place}</TableCell>
                <TableCell>{comp.organiser}</TableCell>
                <TableCell className="text-right">
                  {`${comp.deadline?.getFullYear()}. ${comp.deadline?.getMonth()}. ${comp.deadline?.getDate()}.`}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {loading ?? <div>Loading...</div>}
        {/*<Input
          type="number"
          onBlur={(event) => {
            setLoading(true);
            limit.current = parseInt(event.target.value);
          }}
          defaultValue={limit.current}
        />*/}
      </div>
    </div>
  );
}
