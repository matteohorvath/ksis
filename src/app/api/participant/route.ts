import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

type Competition = {
  date: string;
  event: string;
  category: string;
  participantsCount: string;
  position: string;
  standard: string;
  latin: string;
  points: string;
  eventLink?: string;
  categoryLink?: string;
};

type ParticipantData = {
  name: string;
  club: string;
  ageGroup?: string;
  standardClass?: string;
  latinClass?: string;
  competitions: Competition[];
};

export async function GET(request: Request) {
  try {
    // Get the participant ID from the URL query parameter
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Participant ID is required" },
        { status: 400 }
      );
    }

    const participantData = await fetchParticipant(id);
    return NextResponse.json(participantData);
  } catch (error) {
    console.error("Error fetching participant data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch participant data",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

async function fetchParticipant(id: string): Promise<ParticipantData> {
  const response = await fetch(`https://ksis.szts.sk/mtasz/par.php?id=${id}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Extract participant info
  const name = $("h3").first().text().trim();
  const club = $("p").first().text().trim();

  // Extract age group and classifications
  const infoText = $("h5").next("p").text().trim();
  const ageGroupMatch = infoText.match(/Korcsoport: \*\*([^*]+)\*\*/);
  const standardClassMatch = infoText.match(
    /Standard besorolás: \*\*([^*]+)\*\*/
  );
  const latinClassMatch = infoText.match(/Latin besorolás: \*\*([^*]+)\*\*/);

  const ageGroup = ageGroupMatch ? ageGroupMatch[1].trim() : undefined;
  const standardClass = standardClassMatch
    ? standardClassMatch[1].trim()
    : undefined;
  const latinClass = latinClassMatch ? latinClassMatch[1].trim() : undefined;

  // Extract competition history
  const competitions: Competition[] = [];

  // Find the competition history table - looking for the table with appropriate headers
  const tables = $("table.table");
  let competitionTable = null;

  tables.each((i, table) => {
    // Check if this is the right table by looking for date in first column header
    const firstHeader = $(table).find("thead th").first().text().trim();
    if (firstHeader.includes("Dátum")) {
      competitionTable = table;
      return false; // break the loop
    }
  });

  if (competitionTable) {
    $(competitionTable)
      .find("tbody tr")
      .each((i, row) => {
        const cells = $(row).find("td");
        if (cells.length < 5) return; // Skip rows with insufficient cells

        // Map column values directly - the basic structure is usually:
        // Date | Event | Category | Participants | Position | Standard | Latin | Points
        const dateRaw = $(cells[0]).text().trim();
        const eventRaw = $(cells[2]).text().trim();
        const categoryRaw = $(cells[3]).text().trim();
        const participantsRaw = $(cells[4]).text().trim();
        const positionRaw = $(cells[5]).text().trim();

        // Get links if they exist
        const eventLink = $(cells[2]).find("a").attr("href") || undefined;
        const categoryLink = $(cells[3]).find("a").attr("href") || undefined;

        // Get remaining columns if they exist
        const standard = cells.length > 5 ? $(cells[5]).text().trim() : "";
        const latin = cells.length > 6 ? $(cells[6]).text().trim() : "";
        const points = cells.length > 7 ? $(cells[7]).text().trim() : "";

        competitions.push({
          date: dateRaw,
          event: eventRaw,
          category: categoryRaw,
          participantsCount: participantsRaw,
          position: positionRaw,
          standard,
          latin,
          points,
          eventLink,
          categoryLink,
        });
      });
  }

  return {
    name,
    club,
    ageGroup,
    standardClass,
    latinClass,
    competitions,
  };
}
