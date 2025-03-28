# KSIS Web API Documentation

## Overview

This document describes the structure of the KSIS web system and how to interact with it for real-time data fetching in a NextJS backend.

## Base URL

```
https://ksis.szts.sk/mtasz
```

## Endpoints

### Year Competitions

```
GET /menu.php?rok={year}
```

- Parameters: `year` (2014-2024)
- Returns: HTML with competition data for the specified year

### Competition Details

```
GET /podujatie.php?pod_id={id}
```

- Parameters: `id` (1-370)
- Returns: HTML with details for the specified competition

### Competition Participants

```
GET /zoznam_prihl.php?id_prop={id}
```

- Parameters: `id_prop` (competition ID)
- Returns: HTML with registered participants for the specified competition, grouped by dance categories

### Upcoming Competitions

```
GET /menu.php?akcia=KS
```

- Returns: HTML with upcoming competitions

### Rankings

```
GET /slp_poradie.php?dt_od={date}&evkor={age}&s_l={style}
```

- Parameters:
  - `date`: Format YYYY.MM.DD (starting from 2011.02.13)
  - `age`: Age categories (SE1, SE2, SE3, SE4, PD)
  - `style`: Dance styles (S, L, T)
- Returns: HTML with rankings for specified parameters

### Other Data Endpoints

- Dancers: `GET /menu.php?akcia=CZ&hladany_text=`
- Couples: `GET /menu.php?akcia=CZP&hladany_text=&vekktg=&vtstt=&vtlat=`
- Formations: `GET /menu.php?akcia=CZF&hladany_text=`
- Judges: `GET /menu.php?akcia=CZR&hladany_text=`
- Counters: `GET /menu.php?akcia=CZS&hladany_text=`

## Data Parsing

HTML responses need to be parsed using a library like BeautifulSoup. Key parsing patterns:

### Competition Data Structure

From yearly listings:

- Date: Found in `<strong>` tags (format: YYYY.MM.DD)
- Title: Second `<strong>` tag in each competition row
- Place: Third `<strong>` tag, split by ":" to get location
- Categories: Listed in `<a>` tags after the first one

### Upcoming Competitions

- Date: First `<strong>` tag in each row (format: YYYY.MM.DD)
- Title: First `<strong>` tag in the next column
- Organizer: Second `<strong>` tag, split by ":" to get value
- Place: Third `<strong>` tag, split by ":" to get value
- Deadline: Fourth `<strong>` tag, split by ":" to get date value

### Competition Participants

- Competition title and date: Found in H3 heading
- Venue location: Found after the H3 heading
- Participants count: Found in paragraph text (e.g., "Párosok száma...")
- Categories: Each dance category has its own table with headers
- Participants: Each table contains columns for:
  - Number/Rank
  - Participant names (usually in format "Name1 - Name2" for couples)
  - Club/Organization 
  - Country (optional)

## Database Schema

Based on the parsing code, the following schema is used:

```prisma
model Competition {
  id           Int           @id @default(autoincrement())
  date         DateTime
  title        String
  place        String
  organiser    String
  deadline     DateTime
  categories   Category[]
  participants Participant[]
}

model Category {
  id             Int           @id @default(autoincrement())
  name           String
  competition_id Int
  competition    Competition   @relation(fields: [competition_id], references: [id])
  participants   Participant[]
}

model Participant {
  id             Int         @id @default(autoincrement())
  names          String      // Usually in format "Name1 - Name2" for couples
  organization   String
  country        String?
  competition_id Int
  category_id    Int
  competition    Competition @relation(fields: [competition_id], references: [id])
  category       Category    @relation(fields: [category_id], references: [id])
}
```

## NextJS Implementation Recommendations

1. **Fetching Layer**:
   - Create a dedicated service for KSIS API calls
   - Implement caching with revalidation periods appropriate for each data type
   - Use Next.js API routes to proxy requests to KSIS

2. **Parsing**:
   - Use server-side parsing with libraries like cheerio or jsdom
   - Create typed interfaces for all parsed data structures
   - Implement error handling for HTML structure changes

3. **Caching Strategy**:
   - Upcoming competitions: Short TTL (1-6 hours)
   - Competition details: Medium TTL (12-24 hours)
   - Historical data: Long TTL (7+ days)

4. **Real-time Updates**:
   - Implement webhook endpoints that trigger refetching when needed
   - Use SWR or React Query for client-side data fetching with revalidation

5. **Rate Limiting**:
   - Implement request throttling to avoid overloading the KSIS server
   - Consider batch processing for historical data
