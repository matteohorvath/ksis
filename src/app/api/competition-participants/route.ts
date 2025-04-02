import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

type Participant = {
  number: string;
  name: string;
  club: string;
  country?: string;
};

type Category = {
  name: string;
  participants: Participant[];
};

type ApiResponse = {
  title: string;
  date: string;
  location: string;
  participantCount: string;
  categories: Category[];
};

export async function GET(request: Request) {
  try {
    // Get the competition ID from the URL query parameter
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Competition ID is required" },
        { status: 400 }
      );
    }

    const participantsData = await fetchParticipants(id);
    return NextResponse.json(participantsData);
  } catch (error) {
    console.error("Error fetching participants data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch participants data",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

async function fetchParticipants(id: string): Promise<ApiResponse> {
  const response = await fetch(
    `https://ksis.szts.sk/mtasz/zoznam_prihl.php?id_prop=${id}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Extract basic information about the competition
  const titleText = $(".jumbotron h3").text().trim();
  const title = titleText.split("<small>")[0].replace("Nevezések:", "").trim();
  const date = $(".jumbotron h3 small").text().trim();
  const location = $(".jumbotron p").text().trim();
  const participantCount = $(".jumbotron h5").text().trim();

  const categories: Category[] = [];

  // Find all category tables
  $(".container table.table").each((index, tableElement) => {
    const categoryName = $(tableElement)
      .find("thead th.titulka strong")
      .text()
      .trim();

    if (!categoryName) return;

    const participants: Participant[] = [];

    $(tableElement)
      .find("tbody tr")
      .each((rowIndex, row) => {
        const number = $(row).find("td").eq(0).text().trim();
        const name = $(row).find("td").eq(1).text().trim();
        const club = $(row).find("td").eq(2).text().trim();
        const country = $(row).find("td").eq(3).text().trim();

        participants.push({
          number,
          name,
          club,
          ...(country ? { country } : {}),
        });
      });

    categories.push({
      name: categoryName,
      participants,
    });
  });

  return {
    title,
    date,
    location,
    participantCount,
    categories,
  };
}
