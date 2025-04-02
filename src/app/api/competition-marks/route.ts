import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

type MarkRow = {
  [key: string]: string;
};

type MarkSection = {
  title: string;
  headers: string[];
  rows: MarkRow[];
};

type MarkData = {
  title: string;
  sections: MarkSection[];
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

    const marks = await fetchCompetitionMarks(id);
    return NextResponse.json(marks);
  } catch (error) {
    console.error("Error fetching competition marks:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch competition marks",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

async function fetchCompetitionMarks(id: string): Promise<MarkData> {
  const response = await fetch(
    `https://ksis.szts.sk/mtasz/hodnot_sut.php?sutaz_id=${id}`,
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

  // Initialize the structure to hold all marking data
  const markData: MarkData = {
    title,
    sections: [],
  };

  // Find all tables with class "table" that contain the marks
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

    // Extract table headers (judge codes, typically single letters)
    const headers: string[] = [];
    $(table)
      .find("thead th")
      .each((_, th) => {
        headers.push($(th).text().trim());
      });

    // Extract rows (competitors and their marks)
    const rows: MarkRow[] = [];
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
            markData.sections.push({
              title: subsectionTitle,
              headers,
              rows: [],
            });
          }
          return;
        }

        const rowData: MarkRow = {};

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
          if (markData.sections.length > 0) {
            markData.sections[markData.sections.length - 1].rows.push(rowData);
          }
          // Otherwise create a section with the table title if available
          else if (sectionTitle) {
            markData.sections.push({
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
      !markData.sections.some((s) => s.title === sectionTitle)
    ) {
      markData.sections.push({
        title: sectionTitle || `Section ${tableIndex + 1}`,
        headers,
        rows,
      });
    }
  });

  return markData;
}
