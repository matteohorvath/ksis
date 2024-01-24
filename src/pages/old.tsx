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

export default function Home() {
  const comps: Competition[] =
    api.competition.getAllPrevious.useQuery().data ?? [];

  return (
    <div>
      <Nav />
      <div className="px-40">
        <Table>
          <TableCaption>Previous competitions</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Title</TableHead>
              <TableHead>Place</TableHead>
              <TableHead>Organiser</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comps.map((comp) => (
              <TableRow key={comp.id}>
                <TableCell>{comp.title}</TableCell>
                <TableCell>{comp.place}</TableCell>
                <TableCell>{comp.organiser}</TableCell>
                <TableCell className="text-right">
                  {`${comp.date?.getFullYear()}. ${comp.date?.getMonth()}. ${comp.date?.getDate()}.`}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

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
