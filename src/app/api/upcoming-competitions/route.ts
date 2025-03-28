import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

type Category = {
  name: string;
  url: string;
};

type Competition = {
  date: string;
  title: string;
  location: string;
  categories: Category[];
  url: string;
  organizer?: string;
  deadline?: string;
  exactLocation?: string;
};

type Month = {
  name: string;
  competitions: Competition[];
};

type ApiResponse = {
  months: Month[];
};

export async function GET() {
  try {
    // Function to fetch and parse upcoming competition data
    async function fetchUpcomingCompetitions(): Promise<ApiResponse> {
      const response = await fetch(
        "https://ksis.szts.sk/mtasz/menu.php?akcia=KS",
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

      // Parse HTML using cheerio
      const $ = cheerio.load(html);

      // Use current date for filtering upcoming competitions
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      // Initialize the result structure
      const result: ApiResponse = {
        months: [],
      };

      // Find all month panels
      $(".container .panel.panel-primary").each((index, panel) => {
        // Extract month name from the panel heading
        const monthHeader = $(panel).find(".panel-heading").text().trim();
        if (!monthHeader) return; // Skip if no month header

        const competitions: Competition[] = [];

        // Process each row in the table (each competition)
        $(panel)
          .find("table.table tbody tr")
          .each((rowIndex, row) => {
            const dateCell = $(row).find("td").first();
            const detailsCell = $(row).find("td").last();

            if (!dateCell.length || !detailsCell.length) return;

            // Extract date
            const dateText = dateCell.find("strong").text().trim();
            if (!dateText) return;

            // Parse title
            const titleElem = detailsCell.find("font strong").first();
            const title = titleElem.text().trim();

            // Get location
            const locationElem = detailsCell.find("strong").eq(1);
            const location = locationElem.text().trim();

            // Get organizer
            const organizerElem = detailsCell.find("strong").eq(2);
            const organizer = organizerElem ? organizerElem.text().trim() : "";

            // Get deadline
            const deadlineRegex = /Nevezési határidő:\s*([\d\.]+)/;
            const detailsText = detailsCell.html() || "";
            const deadlineMatch = detailsText.match(deadlineRegex);
            const deadline = deadlineMatch ? deadlineMatch[1] : "";

            // Extract categories
            const categories: Category[] = [];

            // Get all the text content after the deadline section
            const fullText = detailsCell.text();
            let categoriesSection = "";

            if (fullText.includes("Nevezési határidő:")) {
              const parts = fullText.split("Nevezési határidő:");
              if (parts.length > 1) {
                // Get the part after "Nevezési határidő:"
                let afterDeadline = parts[1];

                // Remove the deadline itself (which should be at the start)
                afterDeadline = afterDeadline.replace(/^\s*[\d\.]+\s*/, "");

                // Remove the "Nevezések" and "Információk" section if present
                const nevezesekIndex = afterDeadline.indexOf("Nevezések");
                if (nevezesekIndex > -1) {
                  afterDeadline = afterDeadline.substring(0, nevezesekIndex);
                }

                categoriesSection = afterDeadline.trim();
              }
            }

            // Split by commas and remove any empty entries
            if (categoriesSection) {
              const categoryItems = categoriesSection
                .split(",")
                .map((item) => item.trim());

              categoryItems.forEach((item) => {
                if (
                  item &&
                  !item.includes("Nevezések") &&
                  !item.includes("Információk")
                ) {
                  categories.push({
                    name: item,
                    url: "",
                  });
                }
              });
            }

            // Create competition object
            const competition: Competition = {
              date: dateText,
              title,
              location,
              categories,
              url: "", // No direct URL for individual competitions
              organizer,
              deadline,
              exactLocation: location,
            };

            competitions.push(competition);
          });

        // Add month data to result if competitions were found
        if (competitions.length > 0) {
          result.months.push({
            name: monthHeader,
            competitions,
          });
        }
      });

      // Sort months chronologically (earliest first for upcoming competitions)
      result.months.sort((a, b) => {
        const monthOrder: Record<string, number> = {
          Január: 1,
          Február: 2,
          Március: 3,
          Április: 4,
          Május: 5,
          Június: 6,
          Július: 7,
          Augusztus: 8,
          Szeptember: 9,
          Október: 10,
          November: 11,
          December: 12,
        };

        // Extract month name (without year)
        const monthNameA = a.name.split(" ")[0];
        const monthNameB = b.name.split(" ")[0];

        return (monthOrder[monthNameA] || 0) - (monthOrder[monthNameB] || 0);
      });

      return result;
    }

    // Fetch the competition data
    const result = await fetchUpcomingCompetitions();

    // Return the parsed data
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error scraping upcoming competition data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch upcoming competition data",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
