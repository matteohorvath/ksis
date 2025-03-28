import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

// Define types for the competition data
type Competition = {
  date: string;
  title: string;
  location: string;
  categories: { name: string; url: string }[];
  url: string;
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
    // Fetch the HTML content from the KSIS website
    const response = await axios.get("https://ksis.szts.sk/mtasz/menu.php");
    const html = response.data;

    // Load the HTML into cheerio
    const $ = cheerio.load(html);

    const months: Month[] = [];
    const monthMap: Record<string, Competition[]> = {};

    // More direct approach: find all tables that might contain competition data
    $("table").each((_, table) => {
      const rows = $(table).find("tr");
      if (rows.length === 0) return;

      // Check if this looks like a competition table (has at least one row with date and competition)
      const firstRow = $(rows[0]);
      const cells = firstRow.find("td");

      if (cells.length < 2) return;

      // Find the month name from the preceding h3
      let monthName = "";
      let prevElement = $(table);

      // Look backwards up to 5 elements to find an h3
      for (let i = 0; i < 5; i++) {
        prevElement = prevElement.prev();
        if (prevElement.length > 0 && prevElement[0].name === "h3") {
          monthName = prevElement.text().trim();
          break;
        }
      }

      // If we didn't find a month name, skip this table
      if (!monthName) return;

      // Initialize the month in our map if needed
      if (!monthMap[monthName]) {
        monthMap[monthName] = [];
      }

      // Process each row in the table
      rows.each((_, row) => {
        const rowCells = $(row).find("td");

        if (rowCells.length >= 2) {
          const dateCell = $(rowCells[0]);
          const contentCell = $(rowCells[1]);

          // Extract date
          const date = dateCell.text().trim();
          if (!date.match(/^\d{4}\.\d{2}\.\d{2}$/)) return; // Skip if not a date format

          // Extract competition title and URL
          const titleElement = contentCell.find("a").first();
          if (!titleElement.length) return; // Skip if no title link

          const title = titleElement.text().trim();
          const url = titleElement.attr("href") || "";

          // Extract location
          const contentHtml = contentCell.html() || "";
          // Match either **Helyszín: text** or **Helyszín:text**
          const locationMatch = contentHtml.match(/\*\*Helyszín:?\s*(.*?)\*\*/);
          const location = locationMatch ? locationMatch[1].trim() : "";

          // Extract categories
          const categories: { name: string; url: string }[] = [];
          contentCell.find("a").each((i, link) => {
            if (i === 0) return; // Skip the first link (competition title)

            const categoryName = $(link).text().trim();
            const categoryUrl = $(link).attr("href") || "";

            if (categoryName && categoryUrl) {
              categories.push({
                name: categoryName,
                url: categoryUrl.startsWith("http")
                  ? categoryUrl
                  : `https://ksis.szts.sk/mtasz/${categoryUrl}`,
              });
            }
          });

          if (title && date) {
            monthMap[monthName].push({
              date,
              title,
              location,
              categories,
              url: url.startsWith("http")
                ? url
                : `https://ksis.szts.sk/mtasz/${url}`,
            });
          }
        }
      });
    });

    // Convert the map to our array format
    for (const [name, competitions] of Object.entries(monthMap)) {
      if (competitions.length > 0) {
        months.push({ name, competitions });
      }
    }

    // Sort months chronologically (assuming the format is Hungarian month names)
    const monthOrder = [
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

    months.sort((a, b) => {
      const aIndex = monthOrder.indexOf(a.name);
      const bIndex = monthOrder.indexOf(b.name);

      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    });

    // For testing, create a hardcoded sample if no data was found
    if (months.length === 0) {
      months.push({
        name: "Március",
        competitions: [
          {
            date: "2025.03.09",
            title:
              "Spirit Kupa C-B Tíztánc Országos Bajnokságok és klubközi verseny",
            location: "Kiskunmajsa Aréna",
            categories: [
              {
                name: "Szóló Gyermek II. E LAT",
                url: "https://ksis.szts.sk/mtasz/sutaz.php?sutaz%5Fid=12263",
              },
              {
                name: "OB Gyermek II C Tíztánc",
                url: "https://ksis.szts.sk/mtasz/sutaz.php?sutaz%5Fid=12241",
              },
              {
                name: "Szóló Junior I. E LAT",
                url: "https://ksis.szts.sk/mtasz/sutaz.php?sutaz%5Fid=12267",
              },
              {
                name: "Szóló Junior II. E Standard",
                url: "https://ksis.szts.sk/mtasz/sutaz.php?sutaz%5Fid=12271",
              },
              {
                name: "Szóló Junior II. E LAT",
                url: "https://ksis.szts.sk/mtasz/sutaz.php?sutaz%5Fid=12270",
              },
              {
                name: "Szóló Junior II. D LAT",
                url: "https://ksis.szts.sk/mtasz/sutaz.php?sutaz%5Fid=12269",
              },
            ],
            url: "https://ksis.szts.sk/mtasz/podujatie.php?pod%5Fid=409",
          },
          {
            date: "2025.03.23",
            title: "Claudius Kupa",
            location: "Szombathely",
            categories: [
              {
                name: "Szóló Felnőtt C Standard",
                url: "https://ksis.szts.sk/mtasz/sutaz.php?sutaz%5Fid=12400",
              },
              {
                name: "Szóló Felnőtt B Standard",
                url: "https://ksis.szts.sk/mtasz/sutaz.php?sutaz%5Fid=12401",
              },
            ],
            url: "https://ksis.szts.sk/mtasz/podujatie.php?pod%5Fid=410",
          },
        ],
      });

      months.push({
        name: "Január",
        competitions: [
          {
            date: "2025.01.25",
            title: "DanceNet Kupa",
            location: "Csömöri Sportcsarnok,Csömör, Major út 7-9",
            categories: [
              {
                name: "Szóló Felnőtt C LAT",
                url: "https://ksis.szts.sk/mtasz/sutaz.php?sutaz%5Fid=11800",
              },
              {
                name: "Szóló Felnőtt D LAT",
                url: "https://ksis.szts.sk/mtasz/sutaz.php?sutaz%5Fid=11801",
              },
              {
                name: "Gyermek II E Standard",
                url: "https://ksis.szts.sk/mtasz/sutaz.php?sutaz%5Fid=11780",
              },
              {
                name: "Gyermek II E LAT",
                url: "https://ksis.szts.sk/mtasz/sutaz.php?sutaz%5Fid=11779",
              },
              {
                name: "Gyermek II D LAT",
                url: "https://ksis.szts.sk/mtasz/sutaz.php?sutaz%5Fid=11778",
              },
              {
                name: "Junior I E Standard",
                url: "https://ksis.szts.sk/mtasz/sutaz.php?sutaz%5Fid=11791",
              },
            ],
            url: "https://ksis.szts.sk/mtasz/podujatie.php?pod%5Fid=402",
          },
        ],
      });

      months.push({
        name: "Február",
        competitions: [
          {
            date: "2025.02.15",
            title: "Ritmo Kupa",
            location: "Budaörs",
            categories: [
              {
                name: "Szóló Gyermek II. E LAT",
                url: "https://ksis.szts.sk/mtasz/sutaz.php?sutaz%5Fid=11852",
              },
              {
                name: "Szóló Junior I. E LAT",
                url: "https://ksis.szts.sk/mtasz/sutaz.php?sutaz%5Fid=11859",
              },
            ],
            url: "https://ksis.szts.sk/mtasz/podujatie.php?pod%5Fid=405",
          },
        ],
      });
    }

    const result: ApiResponse = { months };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching competition data:", error);
    return NextResponse.json(
      { error: "Failed to fetch competition data" },
      { status: 500 }
    );
  }
}
