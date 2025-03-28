import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

type Competition = {
  date: string;
  title: string;
  location: string;
  categories: string[];
  url: string;
};

type MonthlyCompetitions = {
  [month: string]: Competition[];
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year") || "2024";

  try {
    // Fetch HTML content from the website
    const response = await fetch(
      `https://ksis.szts.sk/mtasz/menu.php?akcia=S&rok=${year}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Create object to store competitions by month
    const competitionsByMonth: MonthlyCompetitions = {};

    // Find all panels with months
    $(".panel.panel-primary").each((_, panelElement) => {
      const panel = $(panelElement);
      const monthName = panel.find(".panel-heading").text().trim();

      if (!monthName) return;

      // Initialize array for this month if it doesn't exist
      if (!competitionsByMonth[monthName]) {
        competitionsByMonth[monthName] = [];
      }

      // Find all competition rows in the table
      panel.find("table tbody tr").each((_, rowElement) => {
        const row = $(rowElement);
        const dateElement = row.find("td:nth-child(1) strong");
        const contentCell = row.find("td:nth-child(3)");

        if (!dateElement.length || !contentCell.length) return;

        const date = dateElement.text().trim();

        // Extract title from the FONT tag with a link
        const titleElement = contentCell.find('FONT[COLOR="#0000FF"] strong a');
        const title = titleElement.text().trim();

        // Extract URL from the title link
        const relativeUrl = titleElement.attr("href") || "";
        const url = relativeUrl
          ? `https://ksis.szts.sk/mtasz/${relativeUrl}`
          : "";

        // Extract location from the strong tag after the title
        const locationText = contentCell.find("strong").eq(1).text().trim();
        const location = locationText.replace(/^Helyszín: /, "").trim();

        // Extract categories from all sut_pod links
        const categories: string[] = [];
        contentCell.find("a.sut_pod").each((_, categoryElement) => {
          categories.push($(categoryElement).text().trim());
        });

        if (date && title) {
          competitionsByMonth[monthName].push({
            date,
            title,
            location,
            categories,
            url,
          });
        }
      });
    });

    return NextResponse.json(competitionsByMonth);
  } catch (error) {
    console.error("Error fetching competitions:", error);
    return NextResponse.json(
      { error: "Failed to fetch competitions" },
      { status: 500 }
    );
  }
}
