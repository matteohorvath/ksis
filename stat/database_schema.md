# Database Schema

## Table: `Competition`

**SQL Definition:**
```sql
CREATE TABLE "Competition" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "date" TEXT,
    "location" TEXT
)
```

---

## Table: `sqlite_sequence`

**SQL Definition:**
```sql
CREATE TABLE sqlite_sequence(name,seq)
```

---

## Table: `Event`

**SQL Definition:**
```sql
CREATE TABLE "Event" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "competitionId" INTEGER NOT NULL,
    "falseData" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Event_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
)
```

---

## Table: `Result`

**SQL Definition:**
```sql
CREATE TABLE "Result" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "eventId" INTEGER NOT NULL,
    "participantId" INTEGER NOT NULL,
    "number" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    CONSTRAINT "Result_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Result_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
)
```

---

## Table: `Round`

**SQL Definition:**
```sql
CREATE TABLE "Round" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "eventId" INTEGER NOT NULL,
    CONSTRAINT "Round_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
)
```

---

## Table: `Mark`

**SQL Definition:**
```sql
CREATE TABLE "Mark" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "roundId" INTEGER NOT NULL,
    "participantId" INTEGER NOT NULL,
    "judgeId" INTEGER NOT NULL,
    "judgeSign" TEXT NOT NULL,
    "mark" BOOLEAN NOT NULL,
    "proposedPlacement" INTEGER NOT NULL,
    "danceType" TEXT NOT NULL,
    "resultId" INTEGER NOT NULL,
    CONSTRAINT "Mark_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Mark_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Mark_judgeId_fkey" FOREIGN KEY ("judgeId") REFERENCES "judges" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Mark_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "Result" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
)
```

---

## Table: `judges`

**SQL Definition:**
```sql
CREATE TABLE "judges" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "link" TEXT NOT NULL
)
```

---

## Table: `participants`

**SQL Definition:**
```sql
CREATE TABLE "participants" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "club" TEXT NOT NULL,
    "profileLink" TEXT NOT NULL
)
```

---

## Table: `_EventToJudge`

**SQL Definition:**
```sql
CREATE TABLE "_EventToJudge" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_EventToJudge_A_fkey" FOREIGN KEY ("A") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_EventToJudge_B_fkey" FOREIGN KEY ("B") REFERENCES "judges" ("id") ON DELETE CASCADE ON UPDATE CASCADE
)
```

---

## Table: `_ParticipantToRound`

**SQL Definition:**
```sql
CREATE TABLE "_ParticipantToRound" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_ParticipantToRound_A_fkey" FOREIGN KEY ("A") REFERENCES "participants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ParticipantToRound_B_fkey" FOREIGN KEY ("B") REFERENCES "Round" ("id") ON DELETE CASCADE ON UPDATE CASCADE
)
```

---

## Index: `_EventToJudge_AB_unique`

**Table:** `_EventToJudge`

**SQL Definition:**
```sql
CREATE UNIQUE INDEX "_EventToJudge_AB_unique" ON "_EventToJudge"("A", "B")
```

---

## Index: `_EventToJudge_B_index`

**Table:** `_EventToJudge`

**SQL Definition:**
```sql
CREATE INDEX "_EventToJudge_B_index" ON "_EventToJudge"("B")
```

---

## Index: `_ParticipantToRound_AB_unique`

**Table:** `_ParticipantToRound`

**SQL Definition:**
```sql
CREATE UNIQUE INDEX "_ParticipantToRound_AB_unique" ON "_ParticipantToRound"("A", "B")
```

---

## Index: `_ParticipantToRound_B_index`

**Table:** `_ParticipantToRound`

**SQL Definition:**
```sql
CREATE INDEX "_ParticipantToRound_B_index" ON "_ParticipantToRound"("B")
```

--- 