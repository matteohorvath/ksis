import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

type Judge = {
  name: string;
  location: string;
  link?: string;
  id?: string;
};

type Result = {
  position: string;
  number: string;
  name: string;
  club: string;
  section?: string;
  profileLink?: string;
};

type CompetitionResults = {
  title: string;
  date: string;
  location: string;
  organizer: string;
  organizerRepresentative?: string;
  type: string;
  judges: Judge[];
  participantCount?: string;
  commissioner?: string;
  supervisor?: string;
  announcer?: string;
  counters?: string[];
  results: Result[];
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

    const results = await fetchCompetitionResults(id);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching competition results:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch competition results",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

async function fetchCompetitionResults(
  id: string
): Promise<CompetitionResults> {
  const response = await fetch(
    `https://ksis.szts.sk/mtasz/sutaz.php?sutaz_id=${id}`,
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

  // Extract title and date with a more robust approach
  let title = "";
  let date = "";

  // The title and date are in the h3 tag
  const h3Element = $("h3").first();

  if (h3Element.length) {
    // Get all text content first (includes both title and date)
    const fullText = h3Element.text().trim();

    // Try to find the date part, which is often in bold and parentheses
    const dateMatch = fullText.match(/\(([^)]+)\)/);

    if (dateMatch && dateMatch[1]) {
      date = dateMatch[1].trim();
      // Remove the date part to get just the title
      title = fullText.replace(/\s*\([^)]+\)\s*$/, "").trim();
    } else {
      // If no date in parentheses, just use the whole text as title
      title = fullText;
    }

    // If we failed to get the title, try another approach
    if (!title && h3Element.html()) {
      // This is a fallback for the original approach
      const h3Content = h3Element.html() || "";
      const parts = h3Content.split("<small>");
      if (parts.length > 0) {
        try {
          title = $(parts[0]).text().trim();
        } catch {
          // If this fails, just use the raw text
          title = parts[0].replace(/<[^>]*>/g, "").trim();
        }
      }
    }
  }

  // Extract location and other details
  let location = "";
  let organizer = "";
  let organizerRepresentative = "";
  let type = "";
  let participantCount = "";

  $("h5").each((_, element) => {
    const text = $(element).text().trim();
    if (text.includes("Helyszín:")) {
      location = text.replace(/.*Helyszín:\s*/, "").trim();
    } else if (text.includes("Rendező:")) {
      organizer = text.replace(/.*Rendező:\s*/, "").trim();
    } else if (text.includes("Szervező képviselője:")) {
      organizerRepresentative = text
        .replace(/.*Szervező képviselője:\s*/, "")
        .trim();
    } else if (text.includes("Típus:")) {
      type = text.replace(/.*Típus:\s*/, "").trim();
    } else if (text.includes("Párok száma")) {
      participantCount = text.replace(/.*Párok száma\s*/, "").trim();
    }
  });

  // Extract judges
  const judges: Judge[] = [];

  // Find judge links in the first div after "Pontózók"
  $("b:contains('Pontózók')")
    .parent()
    .find("a")
    .each((_, element) => {
      const linkHref = $(element).attr("href");
      const fullText = $(element).text().trim();

      // Format is usually "Code - Name (Location)"
      const match = fullText.match(/([A-Z])\s*-\s*([^(]+)\(([^)]+)\)/);

      if (match) {
        const id = match[1];
        const name = match[2].trim();
        const location = match[3].trim();
        judges.push({
          name,
          location,
          link: linkHref,
          id,
        });
      }
    });

  // Extract commissioner, supervisor, announcer, and counters with a more robust approach
  let officialsText = "";

  // Find the div that contains all officials info by looking for one with multiple <b> tags
  $(".container > .pull-left").each((_, element) => {
    const divText = $(element).text();
    // Check if this div has multiple official types
    if (
      (divText.includes("Döntnök") ||
        divText.includes("Versenyfelügyelő") ||
        divText.includes("Műsorvezető") ||
        divText.includes("Számlálók")) &&
      !divText.includes("Pontózók")
    ) {
      officialsText = divText;
    }
  });

  // Extract commissioner (Döntnök)
  let commissioner = "";
  if (officialsText.includes("Döntnök")) {
    const dontnokPart = officialsText
      .split("Döntnök:")[1]
      ?.split(/Műsorvezető|Számlálók|Versenyfelügyelő/)[0];
    if (dontnokPart) {
      commissioner = dontnokPart.trim();
    }
  }

  // Extract announcer (Műsorvezető)
  let announcer = "";
  if (officialsText.includes("Műsorvezető")) {
    const announcerPart = officialsText
      .split("Műsorvezető:")[1]
      ?.split(/Számlálók|Versenyfelügyelő|$/)[0];
    if (announcerPart) {
      announcer = announcerPart.trim();
    }
  }

  // Extract counters (Számlálók)
  const counters: string[] = [];
  if (officialsText.includes("Számlálók")) {
    const countersPart = officialsText
      .split("Számlálók:")[1]
      ?.split(/Versenyfelügyelő|$/)[0];
    if (countersPart) {
      const countersList = countersPart.trim();
      countersList.split(",").forEach((counter) => {
        const trimmedCounter = counter.trim();
        if (trimmedCounter) {
          counters.push(trimmedCounter);
        }
      });
    }
  }

  // Extract supervisor (Versenyfelügyelő)
  let supervisor = "";
  if (officialsText.includes("Versenyfelügyelő")) {
    const supervisorPart = officialsText.split(/Versenyfelügyelő:?/)[1];
    if (supervisorPart) {
      supervisor = supervisorPart.trim();
    }
  }

  // Extract results
  const results: Result[] = [];

  // Current section for results (Finals, Semifinals, etc.)
  let currentSection = "";

  // Look for the results table
  $("table.table").each((tableIndex, table) => {
    if ($(table).find("th").text().includes("Helyezés")) {
      // Get table data and look for section headers in italics
      $(table)
        .find("tbody tr")
        .each((_, row) => {
          // Check if this is a section header row (in italics)
          const italicText = $(row).find("td i").text().trim();
          if (italicText) {
            // This is a section header like "Döntő" or "Elődöntő"
            currentSection = italicText;
            return; // Skip this row as it's just a header
          }

          const position = $(row).find("td:nth-child(1)").text().trim();
          if (!position) return; // Skip empty rows

          const number = $(row).find("td:nth-child(2)").text().trim();

          // The name is in the 3rd column, it often contains a link
          let name = "";
          let profileLink = "";

          const nameCell = $(row).find("td:nth-child(3)");
          const nameLink = nameCell.find("a");

          if (nameLink.length) {
            name = nameLink.text().trim();
            profileLink = nameLink.attr("href") || "";
          } else {
            name = nameCell.text().trim();
          }

          const club = $(row).find("td:nth-child(4)").text().trim();

          if (position && name) {
            results.push({
              position,
              number,
              name,
              club,
              section: currentSection,
              profileLink,
            });
          }
        });
    }
  });

  return {
    title,
    date,
    location,
    organizer,
    organizerRepresentative,
    type,
    participantCount,
    judges,
    commissioner,
    supervisor,
    announcer,
    counters,
    results,
  };
}
