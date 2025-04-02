import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

type SkatingRow = {
  [key: string]: string;
};

type SkatingSection = {
  title: string;
  headers: string[];
  rows: SkatingRow[];
};

type SkatingData = {
  title: string;
  sections: SkatingSection[];
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

    const skating = await fetchCompetitionSkating(id);
    return NextResponse.json(skating);
  } catch (error) {
    console.error("Error fetching competition skating:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch competition skating",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

async function fetchCompetitionSkating(id: string): Promise<SkatingData> {
  const response = await fetch(
    `https://ksis.szts.sk/mtasz/skating.php?sutaz_id=${id}`,
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

  // Extract title
  const title = $("h3").text().trim();

  // Initialize the structure to hold all skating data
  const skatingData: SkatingData = {
    title,
    sections: [],
  };

  // Find all tables with class "table" that contain the skating results
  $("table.table").each((tableIndex, table) => {
    // Look for section headers (usually in h4 or similar tags)
    let sectionTitle = "";
    const prevHeader = $(table).prev("h4, h3, p.lead").first();
    if (prevHeader.length) {
      sectionTitle = prevHeader.text().trim();
    }

    // If no explicit header found, look for table title/caption
    if (!sectionTitle) {
      const caption = $(table).find("caption").first();
      if (caption.length) {
        sectionTitle = caption.text().trim();
      }
    }

    // Extract table headers
    const headers: string[] = [];
    $(table)
      .find("thead th")
      .each((_, th) => {
        headers.push($(th).text().trim());
      });

    // Extract rows
    const rows: SkatingRow[] = [];
    $(table)
      .find("tbody tr")
      .each((_, tr) => {
        // Check if this is a section header in the table
        if (
          $(tr).find("td[colspan]").length &&
          $(tr).find("td i, td b").length
        ) {
          // This is a subsection header within the table
          const subsectionTitle = $(tr).text().trim();
          if (subsectionTitle) {
            skatingData.sections.push({
              title: subsectionTitle,
              headers,
              rows: [],
            });
          }
          return;
        }

        const rowData: SkatingRow = {};

        $(tr)
          .find("td")
          .each((colIndex, td) => {
            if (colIndex < headers.length) {
              rowData[headers[colIndex]] = $(td).text().trim();
            }
          });

        // If we have data in this row
        if (Object.keys(rowData).length > 0) {
          // If there's an active section, add to it
          if (skatingData.sections.length > 0) {
            skatingData.sections[skatingData.sections.length - 1].rows.push(
              rowData
            );
          }
          // Otherwise create a section with the table title if available
          else if (sectionTitle) {
            skatingData.sections.push({
              title: sectionTitle,
              headers,
              rows: [rowData],
            });
          }
          // Last resort: add to a generic section
          else {
            rows.push(rowData);
          }
        }
      });

    // If we collected rows but haven't added a section yet, add one now
    if (
      rows.length > 0 &&
      !skatingData.sections.some((s) => s.title === sectionTitle)
    ) {
      skatingData.sections.push({
        title: sectionTitle || `Section ${tableIndex + 1}`,
        headers,
        rows,
      });
    }
  });

  return skatingData;
}
