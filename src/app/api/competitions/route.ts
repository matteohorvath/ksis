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
    // Fetch data from the target website with the correct endpoint parameter
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

    // Initialize the result structure
    const result: ApiResponse = {
      months: [],
    };

    // The website structure has panels for each month with tables inside
    // Each panel has a panel-heading with the month name and a table with class "table"
    $(".panel.panel-primary").each((panelIndex, panel) => {
      // Extract month name from the panel heading
      const monthHeader = $(panel).find(".panel-heading").text().trim();

      if (!monthHeader) {
        console.log(`No month header found for panel ${panelIndex}`);
        return; // Skip if no month header
      }

      const competitions: Competition[] = [];
      const currentDate = new Date();

      // Find the table within this panel
      $(panel)
        .find("table.table tbody tr")
        .each((rowIndex, row) => {
          const cells = $(row).find("td");
          if (cells.length < 2) {
            console.log(`Row ${rowIndex} has insufficient cells`);
            return; // Skip rows with insufficient cells
          }

          // Extract date from the first cell
          const dateCell = $(cells[0]);
          const dateText = dateCell.find("strong").text().trim();

          if (!dateText) {
            console.log(`No date found in row ${rowIndex}`);
            return;
          }

          // Parse the date
          let competitionDate;
          try {
            // The date format is YYYY.MM.DD
            const [year, month, day] = dateText.split(".").map(Number);
            competitionDate = new Date(year, month - 1, day);

            // Skip past competitions
            if (competitionDate < currentDate) {
              console.log(`Skipping past competition: ${dateText}`);
              return;
            }
          } catch (e) {
            console.log(`Error parsing date ${dateText}: ${e}`);
            return;
          }

          // Get the details cell (second cell)
          const detailsCell = $(cells[1]);

          // Extract the title (first strong element with blue font)
          const titleElement = detailsCell.find("font[color='#0000FF'] strong");
          const title = titleElement.text().trim();

          if (!title) {
            console.log(`No title found for competition in row ${rowIndex}`);
            return;
          }

          // Extract location (second strong element)
          const strongElements = detailsCell.find("strong");
          let location = "";
          if (strongElements.length > 1) {
            location = $(strongElements[1]).text().trim();
            // Remove label prefix entirely
            location = location.replace(/^.*?: /, "");
          }

          // Extract organizer (third strong element)
          let organizer = "";
          if (strongElements.length > 2) {
            organizer = $(strongElements[2]).text().trim();
            // Remove label prefix entirely
            organizer = organizer.replace(/^.*?: /, "");
          }

          // Extract deadline (fourth strong element)
          let deadline = "";
          if (strongElements.length > 3) {
            deadline = $(strongElements[3]).text().trim();
            // Remove label prefix entirely
            deadline = deadline.replace(/^.*?: /, "");
          }

          // Extract categories
          const categories: Category[] = [];

          // The categories are listed in the text after the last strong element
          // They're separated by commas
          const contentText = detailsCell.text();

          // Find the text after "Nevezési határidő"
          const afterDeadlineText = contentText.split(deadline)[1];
          if (afterDeadlineText) {
            // Get the text before the "Nevezések" or "Információk" link
            const categoriesText = afterDeadlineText
              .split(/Nevezések|Információk/)[0]
              .trim();

            if (categoriesText) {
              // Split by commas and clean up
              const categoryList = categoriesText
                .replace(/\s+/g, " ")
                .split(",");
              categoryList.forEach((cat) => {
                const catTrimmed = cat.trim();
                if (
                  catTrimmed &&
                  !catTrimmed.includes("<br>") &&
                  catTrimmed !== "," &&
                  catTrimmed !== ""
                ) {
                  categories.push({
                    name: catTrimmed,
                    url: "",
                  });
                }
              });
            }
          }

          // Extract URL from the "Információk" link
          let url = "";
          const infoLinkMatch = detailsCell
            .html()
            ?.match(/javascript: ukazProp\((\d+)\)/);
          if (infoLinkMatch && infoLinkMatch[1]) {
            url = `https://ksis.szts.sk/mtasz/prop.php?id_prop=${infoLinkMatch[1]}`;
          }

          // Create competition object
          const competition: Competition = {
            date: dateText,
            title,
            location,
            categories,
            url,
            organizer,
            deadline,
            exactLocation: location,
          };

          console.log(`Added competition: ${title} on ${dateText}`);
          competitions.push(competition);
        });

      // Add month data to result if competitions were found
      if (competitions.length > 0) {
        result.months.push({
          name: monthHeader,
          competitions,
        });
        console.log(
          `Added month ${monthHeader} with ${competitions.length} competitions`
        );
      } else {
        console.log(`No competitions found for month ${monthHeader}`);
      }
    });

    console.log(`Total months processed: ${result.months.length}`);

    // If no competitions were found, log an error
    if (result.months.length === 0) {
      console.log("No competitions found. HTML structure may have changed.");

      // Log some debug info about the HTML structure
      console.log(
        `Total panel elements found: ${$(".panel.panel-primary").length}`
      );
      console.log(`Total table elements found: ${$("table.table").length}`);

      // Try to find if there are any tables at all
      console.log(`Any tables found: ${$("table").length}`);

      // Return empty result with debug info
      return NextResponse.json({
        months: [],
        debug: {
          panelsFound: $(".panel.panel-primary").length,
          tablesFound: $("table.table").length,
          anyTablesFound: $("table").length,
        },
      });
    }

    // Return the parsed data
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error scraping competition data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch competition data",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
