import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

type Dancer = {
  name: string;
  club: string;
  url: string;
};

type RankingEntry = {
  position: string;
  dancers: Dancer;
  competitions: {
    [key: string]: string;
  };
  wdsf: string;
  national: string;
  points: string;
};

type RankingResponse = {
  date: string;
  ageGroup: string;
  danceType: string;
  competitions: {
    name: string;
    date: string;
    location: string;
    url: string;
  }[];
  rankings: RankingEntry[];
};

export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const dt_od = searchParams.get("dt_od") || "2025.03.28";
    const evkor = searchParams.get("evkor") || "FLN";
    const s_l = searchParams.get("s_l") || "L";

    // Fetch data from the target website
    const response = await fetch(
      `https://ksis.szts.sk/mtasz/slp_poradie.php?dt_od=${dt_od}&evkor=${evkor}&s_l=${s_l}`,
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

    // Extract date, age group, and dance type from the form
    const date = $("#dt_od").val() as string;
    const ageGroup = $("#evkor option:selected").text();
    const danceType = $("#s_l option:selected").text();

    // Extract competition information from table headers
    const competitions: {
      name: string;
      location: string;
      date: string;
      url: string;
    }[] = [];

    // Find all th elements that contain competition information
    $("table thead tr th").each((i, el) => {
      // Skip first two columns (position and dancer/club)
      if (i < 2) return;

      // Skip the last three columns (WDSF, National Championship, Points)
      if (i >= $("table thead tr th").length - 3) return;

      const anchor = $(el).find("a");
      const url = anchor.attr("href") || "";
      const fullText = anchor.text();

      // Split text by line breaks to extract components
      const parts = fullText
        .split(/\r?\n/)
        .map((part) => part.trim())
        .filter(Boolean);

      // If we have valid parts, create a competition entry
      if (parts.length > 0) {
        const name = parts[0] || "";
        const location = parts.length > 1 ? parts[1] : "";
        const date = parts.length > 2 ? parts[2] : "";

        competitions.push({
          name,
          location,
          date,
          url: url ? `https://ksis.szts.sk/mtasz/${url}` : "",
        });
      }
    });

    // Extract rankings data from the table rows
    const rankings: RankingEntry[] = [];

    $("table tbody tr").each((i, row) => {
      const cells = $(row).find("td");

      if (cells.length < 3) return; // Skip rows with insufficient cells

      // Position
      const position = $(cells[0]).text().trim();

      // Dancer info
      const dancerCell = $(cells[1]);
      const dancerLink = dancerCell.find("a");
      const dancerUrl = dancerLink.attr("href") || "";
      const dancerName = dancerLink.text().trim();

      // Extracting club info from text content
      let clubText = "";
      // Get all text nodes directly under dancerCell
      dancerCell.contents().each((_, node) => {
        if (node.type === "text" && $(node).text().trim()) {
          clubText = $(node).text().trim();
        }
      });

      // If no text nodes found with content, try another approach
      if (!clubText) {
        // Remove the anchor tag content and get remaining text
        const fullText = dancerCell.text();
        const nameText = dancerName;
        clubText = fullText.replace(nameText, "").trim();
      }

      // Create the ranking entry
      const entry: RankingEntry = {
        position,
        dancers: {
          name: dancerName,
          club: clubText,
          url: dancerUrl ? `https://ksis.szts.sk/mtasz/${dancerUrl}` : "",
        },
        competitions: {},
        wdsf: "",
        national: "",
        points: "",
      };

      // Extract competition scores (cells 2 to n-3)
      for (let j = 2; j < cells.length - 3; j++) {
        const competitionCell = $(cells[j]);
        let competitionValue = competitionCell.text().trim();

        // Check if the value is styled as italics/grayed out
        if (competitionCell.attr("style")?.includes("color:#BBBBBB")) {
          competitionValue = competitionValue.replace(/\s+/g, " ");
        }

        if (competitionValue) {
          entry.competitions[j - 2] = competitionValue;
        }
      }

      // WDSF competition
      entry.wdsf = $(cells[cells.length - 3])
        .text()
        .trim();

      // National competition
      entry.national = $(cells[cells.length - 2])
        .text()
        .trim();

      // Total points
      entry.points = $(cells[cells.length - 1])
        .text()
        .trim();

      rankings.push(entry);
    });

    // Prepare response
    const result: RankingResponse = {
      date,
      ageGroup,
      danceType,
      competitions,
      rankings,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error scraping ranking data:", error);
    return NextResponse.json(
      { error: "Failed to fetch rankings data", message: error.message },
      { status: 500 }
    );
  }
}
