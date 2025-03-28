import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

// Define types for the competition data
type Competition = {
  id: string;
  date: string;
  title: string;
  place: string;
  organiser: string;
  deadline: string;
  exactLocation?: string;
  categories?: { name: string; url: string }[];
  url: string;
};

type Month = {
  name: string;
  competitions: {
    date: string;
    title: string;
    location: string;
    categories: { name: string; url: string }[];
    url: string;
    organizer?: string;
    deadline?: string;
    exactLocation?: string;
  }[];
};

type ApiResponse = {
  months: Month[];
};

const BASE_URL = "https://ksis.szts.sk/mtasz";

// Helper function to group competitions by month
function groupCompetitionsByMonth(competitions: Competition[]): Month[] {
  const monthsMap = new Map<string, Month>();

  // Hungarian month names
  const monthNames = [
    "Január",
    "Február",
    "Március",
    "Április",
    "Május",
    "Június",
    "Július",
    "Augusztus",
    "Szeptember",
    "Október",
    "November",
    "December",
  ];

  competitions.forEach((comp) => {
    // Parse date from YYYY.MM.DD format
    const [year, month] = comp.date.split(".").map(Number);
    const monthIndex = month - 1; // Convert to 0-based index
    const monthName = `${monthNames[monthIndex]} ${year}`;

    if (!monthsMap.has(monthName)) {
      monthsMap.set(monthName, {
        name: monthName,
        competitions: [],
      });
    }

    monthsMap.get(monthName)?.competitions.push({
      date: comp.date,
      title: comp.title,
      location: comp.place, // Map 'place' to 'location'
      categories: comp.categories || [],
      url: comp.url,
      organizer: comp.organiser, // Map 'organiser' to 'organizer'
      deadline: comp.deadline,
      exactLocation: comp.exactLocation,
    });
  });

  // Sort months chronologically
  return Array.from(monthsMap.values()).sort((a, b) => {
    const [monthA, yearA] = a.name.split(" ");
    const [monthB, yearB] = b.name.split(" ");

    const yearDiff = parseInt(yearA) - parseInt(yearB);
    if (yearDiff !== 0) return yearDiff;

    const monthIndexA = monthNames.indexOf(monthA);
    const monthIndexB = monthNames.indexOf(monthB);
    return monthIndexA - monthIndexB;
  });
}

export async function GET() {
  try {
    // Fetch the HTML content from the KSIS website using the correct endpoint for upcoming competitions
    const response = await axios.get(`${BASE_URL}/menu.php?akcia=KS`);
    const html = response.data;

    // Load the HTML into cheerio
    const $ = cheerio.load(html);

    const competitions: Competition[] = [];

    // Process competition rows from the table
    // According to DB.md, upcoming competitions have this structure:
    // - Date: First <strong> tag in each row (format: YYYY.MM.DD)
    // - Title: First <strong> tag in the next column
    // - Organizer: Second <strong> tag, split by ":" to get value
    // - Place: Third <strong> tag, split by ":" to get value
    // - Deadline: Fourth <strong> tag, split by ":" to get date value

    $("table tr").each((_, row) => {
      const cells = $(row).find("td");
      if (cells.length < 2) return;

      // Extract date from the first cell
      const dateCell = $(cells[0]);
      const dateText = dateCell.find("strong").first().text().trim();

      // Skip if not a valid date format
      if (!dateText.match(/^\d{4}\.\d{2}\.\d{2}$/)) return;

      // Extract data from the second cell
      const contentCell = $(cells[1]);
      const strongTags = contentCell.find("strong");

      if (strongTags.length < 4) return;

      // Extract title (first strong tag)
      const title = $(strongTags[0]).text().trim();

      // Extract organiser (second strong tag)
      const organiserText = $(strongTags[1]).text().trim();
      const organiser = organiserText.split(":")[1]?.trim() || organiserText;

      // Extract place (third strong tag)
      const placeText = $(strongTags[2]).text().trim();
      const place = placeText.split(":")[1]?.trim() || placeText;

      // Extract deadline (fourth strong tag)
      const deadlineText = $(strongTags[3]).text().trim();
      const deadline = deadlineText.split(":")[1]?.trim() || "";

      // Extract URL from the first link that points to a competition detail
      let url = "";
      let id = "";
      contentCell.find("a").each((_, link) => {
        const href = $(link).attr("href") || "";
        if (href.includes("podujatie.php?pod_id=")) {
          url = href;
          const idMatch = href.match(/pod_id=(\d+)/);
          id = idMatch ? idMatch[1] : "";
          return false; // Break the loop after finding the first matching link
        }
      });

      // Extract categories
      const categories: { name: string; url: string }[] = [];
      contentCell.find("a").each((_, link) => {
        const href = $(link).attr("href") || "";
        if (href.includes("sutaz.php?sutaz_id=")) {
          const categoryName = $(link).text().trim();
          categories.push({
            name: categoryName,
            url: href.startsWith("http") ? href : `${BASE_URL}/${href}`,
          });
        }
      });

      if (title && dateText) {
        const competitionData: Competition = {
          id,
          date: dateText,
          title,
          place,
          organiser,
          deadline,
          categories,
          url: url.startsWith("http") ? url : `${BASE_URL}/${url}`,
        };

        competitions.push(competitionData);
      }
    });

    // If no data was found, return an error
    if (competitions.length === 0) {
      console.error("No competition data found from KSIS API");
      return NextResponse.json(
        { error: "No competition data available", months: [] },
        { status: 404 }
      );
    }

    // Group competitions by month before sending the response
    const months = groupCompetitionsByMonth(competitions);
    const result: ApiResponse = { months };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching competition data:", error);
    return NextResponse.json(
      { error: "Failed to fetch competition data", months: [] },
      { status: 500 }
    );
  }
}
