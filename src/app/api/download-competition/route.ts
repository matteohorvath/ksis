import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import JSZip from "jszip";

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

type Judge = {
  name: string;
  location: string;
  link?: string;
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
  participantCount?: string;
  judges: Judge[];
  commissioner?: string;
  supervisor?: string;
  announcer?: string;
  counters?: string[];
  results: Result[];
};

// Function to transliterate Hungarian characters to English equivalents
const transliterateHungarianToEnglish = (text: string): string => {
  const hungarianMap: { [key: string]: string } = {
    á: "a",
    Á: "A",
    é: "e",
    É: "E",
    í: "i",
    Í: "I",
    ó: "o",
    Ó: "O",
    ö: "o",
    Ö: "O",
    ő: "o",
    Ő: "O",
    ú: "u",
    Ú: "U",
    ü: "u",
    Ü: "U",
    ű: "u",
    Ű: "U",
  };

  return text
    .split("")
    .map((char) => hungarianMap[char] || char)
    .join("");
};

export async function GET(request: Request) {
  try {
    // Get the competition ID and fields from the URL query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const fields = searchParams.get("fields") || "all";

    if (!id) {
      return NextResponse.json(
        { error: "Competition ID is required" },
        { status: 400 }
      );
    }

    // Parse the fields to determine what to include
    // eg.
    console.log(fields);
    const fieldsArray = fields.split(",").map((f) => f.trim().toLowerCase());
    const includeAll = fields === "all" || fieldsArray.includes("all");
    const includeMarks = includeAll || fieldsArray.includes("marks");
    const includeResults = includeAll || fieldsArray.includes("results");
    const includeJudges = includeAll || fieldsArray.includes("judges");
    const includeSkating = includeAll || fieldsArray.includes("skating");
    const includeInfo = includeAll || fieldsArray.includes("info");

    // Get competition data
    let competitionResults: CompetitionResults | null = null;
    let markData: MarkData | null = null;
    let skatingData: MarkData | null = null;
    let competitionTitle = "";

    // Fetch basic competition data (always needed for title)
    const resultsResponse = await fetch(
      `https://ksis.szts.sk/mtasz/vysledky_sut.php?sutaz_id=${id}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      }
    );

    if (resultsResponse.ok) {
      const resultsHtml = await resultsResponse.text();
      const $results = cheerio.load(resultsHtml);
      competitionTitle = $results("h3").text().trim();

      if (includeResults || includeJudges || includeInfo) {
        // Fetch full results data from API
        const resultsApiResponse = await fetch(
          `${
            process.env.NEXT_PUBLIC_BASE_URL || "https://ksis.szts.sk"
          }/api/competition-results?id=${id}`,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
          }
        );
        if (resultsApiResponse.ok) {
          competitionResults = await resultsApiResponse.json();
        } else {
          console.error(
            `Failed to fetch competition results: ${resultsApiResponse.status}`
          );
        }
      }
    } else {
      competitionTitle = `competition_${id}`;
    }

    // Fetch marks data if needed
    if (includeMarks) {
      markData = await fetchCompetitionMarks(id);
    }

    // Fetch skating data if needed
    if (includeSkating) {
      try {
        const skatingResponse = await fetch(
          `${
            process.env.NEXT_PUBLIC_BASE_URL || "https://ksis.szts.sk"
          }/api/competition-skating?id=${id}`,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
          }
        );
        if (skatingResponse.ok) {
          skatingData = await skatingResponse.json();
        } else {
          console.error(
            `Failed to fetch skating data: ${skatingResponse.status}`
          );
        }
      } catch (error) {
        console.error("Error fetching skating data:", error);
        // Continue without skating data if there's an error
      }
    }

    // Create a ZIP file for the selected data
    const zip = new JSZip();

    // Add competition info if requested
    if (includeInfo && competitionResults) {
      const infoFolder = zip.folder("competition-info");

      // Add competition details CSV
      let competitionInfoCSV = "";
      competitionInfoCSV += `Title,${competitionResults.title}\n`;
      competitionInfoCSV += `Date,${competitionResults.date}\n`;
      competitionInfoCSV += `Location,${competitionResults.location}\n`;
      competitionInfoCSV += `Organizer,${competitionResults.organizer}\n`;
      if (competitionResults.organizerRepresentative) {
        competitionInfoCSV += `Organizer Representative,${competitionResults.organizerRepresentative}\n`;
      }
      competitionInfoCSV += `Type,${competitionResults.type}\n`;
      if (competitionResults.participantCount) {
        competitionInfoCSV += `Participant Count,${competitionResults.participantCount}\n`;
      }

      infoFolder?.file("competition-details.csv", competitionInfoCSV);

      // Add officials CSV if available
      let officialsCSV = "Role,Name\n";
      if (competitionResults.commissioner) {
        officialsCSV += `Commissioner,${competitionResults.commissioner}\n`;
      }
      if (competitionResults.supervisor) {
        officialsCSV += `Supervisor,${competitionResults.supervisor}\n`;
      }
      if (competitionResults.announcer) {
        officialsCSV += `Announcer,${competitionResults.announcer}\n`;
      }
      if (
        competitionResults.counters &&
        competitionResults.counters.length > 0
      ) {
        competitionResults.counters.forEach((counter) => {
          officialsCSV += `Counter,${counter}\n`;
        });
      }

      // Only add officials file if there's data
      if (officialsCSV !== "Role,Name\n") {
        infoFolder?.file("officials.csv", officialsCSV);
      }
    }

    // Add judges data if requested
    if (
      includeJudges &&
      competitionResults &&
      competitionResults.judges.length > 0
    ) {
      const judgesFolder = zip.folder("judges");
      let judgesCSV = "Name,Location\n";

      competitionResults.judges.forEach((judge) => {
        judgesCSV += `${judge.name},${judge.location}\n`;
      });

      judgesFolder?.file("judges.csv", judgesCSV);
    }

    // Add results data if requested
    if (
      includeResults &&
      competitionResults &&
      competitionResults.results.length > 0
    ) {
      const resultsFolder = zip.folder("results");

      // Group results by section
      const groupedResults: Record<string, Result[]> =
        competitionResults.results.reduce((acc, result) => {
          const section = result.section || "Other Results";
          if (!acc[section]) {
            acc[section] = [];
          }
          acc[section].push(result);
          return acc;
        }, {} as Record<string, Result[]>);

      // Create a file for each section
      Object.entries(groupedResults).forEach(([section, results]) => {
        if (results.length > 0) {
          let resultsCSV = "Position,Number,Name,Club\n";

          results.forEach((result) => {
            resultsCSV += `${result.position},${result.number},${result.name},${result.club}\n`;
          });

          // Create a safe filename from section name
          const transliterated = transliterateHungarianToEnglish(section);
          const safeFileName = transliterated
            .replace(/[^a-z0-9]/gi, "_")
            .toLowerCase();

          resultsFolder?.file(`${safeFileName}.csv`, resultsCSV);
        }
      });
    }

    // Add marks data if requested
    if (
      includeMarks &&
      markData &&
      markData.sections &&
      markData.sections.length > 0
    ) {
      const marksFolder = zip.folder("marks");

      markData.sections.forEach((section, index) => {
        let sectionCSV = "";

        // Add section title as a comment
        sectionCSV += `# ${section.title}\n`;

        // Add headers
        sectionCSV += section.headers.join(",") + "\n";

        // Add rows
        section.rows.forEach((row) => {
          const rowValues = section.headers.map((header) => {
            // Escape commas in CSV values
            let value = row[header] || "";
            if (value.includes(",")) {
              value = `"${value}"`;
            }
            return value;
          });
          sectionCSV += rowValues.join(",") + "\n";
        });

        // Create a safe filename
        const transliterated = transliterateHungarianToEnglish(section.title);
        const safeFileName = transliterated
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase();

        marksFolder?.file(`${safeFileName}_${index}.csv`, sectionCSV);
      });
    }

    // Add skating data if requested
    if (
      includeSkating &&
      skatingData &&
      skatingData.sections &&
      skatingData.sections.length > 0
    ) {
      const skatingFolder = zip.folder("skating");

      skatingData.sections.forEach((section, index) => {
        let sectionCSV = "";

        // Add section title as a comment
        sectionCSV += `# ${section.title}\n`;

        // Add headers
        sectionCSV += section.headers.join(",") + "\n";

        // Add rows
        section.rows.forEach((row) => {
          const rowValues = section.headers.map((header) => {
            // Escape commas in CSV values
            let value = row[header] || "";
            if (value.includes(",")) {
              value = `"${value}"`;
            }
            return value;
          });
          sectionCSV += rowValues.join(",") + "\n";
        });

        // Create a safe filename
        const transliterated = transliterateHungarianToEnglish(section.title);
        const safeFileName = transliterated
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase();

        skatingFolder?.file(`${safeFileName}_${index}.csv`, sectionCSV);
      });
    }

    // Generate ZIP file content
    const zipContent = await zip.generateAsync({ type: "nodebuffer" });

    // Determine ZIP filename based on content
    const transliteratedTitle =
      transliterateHungarianToEnglish(competitionTitle);
    let filenameSuffix = "";

    if (!includeAll) {
      if (fieldsArray.length === 1) {
        filenameSuffix = `_${fieldsArray[0]}`;
      } else {
        filenameSuffix = "_data";
      }
    }

    const safeZipName = `${transliteratedTitle.replace(
      /\s+/g,
      "_"
    )}${filenameSuffix}.zip`;

    // Return the ZIP file as a response
    return new NextResponse(zipContent, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${safeZipName}"`,
        "Content-Length": zipContent.length.toString(),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Error creating competition ZIP file:", error);
    return NextResponse.json(
      {
        error: "Failed to create competition ZIP file",
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
