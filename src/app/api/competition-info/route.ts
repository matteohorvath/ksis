import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

type CompetitionInfo = {
  title: string;
  date: string;
  location: string;
  info: string;
  organizer?: string;
  organizerAddress?: string;
  organizerPhone?: string;
  organizerEmail?: string;
  organizerWebsite?: string;
  representative?: string;
  deadline?: string;
  venueCapacity?: string;
  danceFloorSize?: string;
  danceFloorSurface?: string;
  entranceFee?: string;
  awards?: string;
  notes?: string;
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

    const competitionInfo = await fetchCompetitionInfo(id);
    return NextResponse.json(competitionInfo);
  } catch (error) {
    console.error("Error fetching competition info:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch competition info",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

async function fetchCompetitionInfo(id: string): Promise<CompetitionInfo> {
  const response = await fetch(
    `https://ksis.szts.sk/mtasz/prop.php?lang=hu&id_prop=${id}`,
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

  // Find the Információk section
  let info = "";
  $(".row").each((i, elem) => {
    const label = $(elem).find(".col-md-3").text().trim();
    if (label === "Információk") {
      info = $(elem).find(".col-md-9 b").html() || "";
      // Replace <br> with newlines for better formatting
      info = info.replace(/<br\s*\/?>/gi, "\n");
    }
  });

  // Extract other information
  let title = "";
  let date = "";
  let location = "";
  let organizer = "";
  let organizerAddress = "";
  let organizerPhone = "";
  let organizerEmail = "";
  let organizerWebsite = "";
  let representative = "";
  let deadline = "";
  let venueCapacity = "";
  let danceFloorSize = "";
  let danceFloorSurface = "";
  let entranceFee = "";
  let awards = "";
  let notes = "";

  $(".row").each((i, elem) => {
    const label = $(elem).find(".col-md-3").text().trim();

    if (label === "Versenyért felelős tagszervezet") {
      // Extract all lines from the organizer section
      const organizerInfoElement = $(elem).find(".col-md-9");
      const organizerInfoText = organizerInfoElement.text().trim();
      const organizerInfoLines = organizerInfoText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line);

      if (organizerInfoLines.length > 0) {
        organizer = organizerInfoLines[0];

        if (organizerInfoLines.length > 1) {
          organizerAddress = organizerInfoLines[1];
        }

        if (organizerInfoLines.length > 2) {
          organizerPhone = organizerInfoLines[2];
        }

        if (organizerInfoLines.length > 3) {
          organizerEmail = organizerInfoLines[3];
        }

        if (organizerInfoLines.length > 4) {
          organizerWebsite = organizerInfoLines[4];
        }
      }
    } else if (label === "Tagszervezet képviselője") {
      representative = $(elem).find(".col-md-9 b").text().trim();
    } else {
      const value = $(elem).find(".col-md-9 b").text().trim();

      switch (label) {
        case "Elnevezés":
          title = value;
          break;
        case "Dátum":
          date = value;
          break;
        case "Helyszín":
          location = value;
          break;
        case "Nevezés határideje":
          deadline = value;
          break;
        case "Befogadó képesség":
          venueCapacity = value;
          break;
        case "Tánctér mérete":
          danceFloorSize = value;
          break;
        case "Tánctér burkolata":
          danceFloorSurface = value;
          break;
        case "Belépőjegy":
          entranceFee = value;
          break;
        case "Díjazás":
          awards = value;
          break;
        case "Megjegyzések":
          notes = value;
          break;
      }
    }
  });

  return {
    title,
    date,
    location,
    info,
    organizer,
    organizerAddress,
    organizerPhone,
    organizerEmail,
    organizerWebsite,
    representative,
    deadline,
    venueCapacity,
    danceFloorSize,
    danceFloorSurface,
    entranceFee,
    awards,
    notes,
  };
}
