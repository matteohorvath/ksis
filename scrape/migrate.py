# scrape/migrate.py
import json
import os
import re
import asyncio
from pathlib import Path
from tqdm.asyncio import tqdm # Import tqdm for async

# Assuming Prisma client is generated in ./generated/prisma relative to this script
# Adjust the import path if your generated client is elsewhere
try:
    from generated.prisma import Prisma, register
    from generated.prisma.models import (
    Competition,
    Event,
    Judge,
    Mark,
    Participant,
    Result,
    Round
    )
    from generated.prisma.errors import PrismaError
except ImportError:
    logging.error("Prisma client not found.") # Use logging
    logging.error("Please run 'prisma generate' in the 'scrape' directory.")
    logging.error("Make sure migrate.py is in the 'scrape' directory.")
    exit(1)

# --- Configuration ---
DATA_DIR = Path(__file__).parent / "competition_data"
DATABASE_URL = "file:./dev.db" # Matches schema.prisma

# --- Load data ---
competitions = []
for file in DATA_DIR.glob("*.json"):
    with open(file, "r") as f:
        competitions.append(json.load(f))
#competitions = competitions[1285:]
# --- Create database ---
db = Prisma()

# --- Main async function ---
async def main():
    await db.connect()
    try:
        await create_judges()
        await create_participants()
        await create_competitions()

        await check_participants()
        await check_judges()
    finally:
        await db.disconnect()

# --- Create competitions ---
async def create_competitions():
    for competition in tqdm(competitions, desc="Creating competitions"):
        
        competitionTitle = competition["title"]
        #date is the last part as a yyyy.mm.dd, finding it with regex
        competitionDate = re.search(r'\d{4}\.\d{2}\.\d{2}', competition["title"]).group(0) + ""

        competitionEntity = await db.competition.create(
            data={
                "title": competitionTitle,
                "date": competitionDate,
                "location": competition["location"]
            }
        )
        await create_event(competitionEntity, competition)

async def create_event(competitionEntity, competition):
        judges = competition["judges"]
        #create evenet and add judges
        eventEntity =await db.event.create(
            data={
                "name": competitionEntity.title,
                "competitionId": competitionEntity.id
            }
        )
        #add judges to event
        for judge in judges:
            judgeEntity = await db.judge.find_first(where={"name": judge["name"]})
            await db.event.update(where={"id": eventEntity.id}, data={"judges": {'connect': {"id": judgeEntity.id}}})
        
        await create_results(competition["results"], eventEntity)
        await create_rounds(eventEntity, competition)

async def create_rounds(eventEntity, competition):
    rounds = competition["sections"]
    for _round in rounds:
        roundEntity = await db.round.create(
            data={
                "name": _round["title"],
                "eventId": eventEntity.id
            }
        )
        await create_marks(roundEntity, _round, competition)

async def create_marks(roundEntity, _round, competition):
    danceHeaders = _round["headers"][2:-3]
    judgeChars = competition["judges"]
    judgeCharString = "".join([judge["id"] for judge in judgeChars])
    judges = []
    for judge in judgeChars:
        judgeEntity = await db.judge.find_first(where={"name": judge["name"]})
        judges.append(judgeEntity)
    eventEntity = await db.event.find_first(where={"name": competition["title"]})
    try:
        for row in _round["rows"]:
            participantId = row["FordulóRsz."]
            #find name in compeition results based on id 
        participantName = ""
        for result in competition["results"]:
            if result["number"] == participantId:
                participantName = result["name"]
                break
        
        participantEntity = await db.participant.find_first(where={"name": participantName})
        resultEntity = await db.result.find_first(where={"participantId": participantEntity.id, "eventId": eventEntity.id})
        
        for danceHeader in danceHeaders:
            for i in range(len(judgeCharString)):
                
                try:
                    proposedPlacement = int(row[danceHeader][i])
                    mark = False
                except:
                    mark = row[danceHeader][i] == "X"
                    proposedPlacement = 0
                
                markEntity = await db.mark.create(
                    data={
                        "round": {
                            "connect": {"id": roundEntity.id}
                        },
                        "participant": {
                            "connect": {"id": participantEntity.id}
                        },
                        "judge": {
                            "connect": {"id": judges[i].id}
                        },
                        "judgeSign": judgeCharString[i],
                        "mark": mark,
                        "proposedPlacement": proposedPlacement,
                        "danceType": danceHeader.split("/")[0],
                        "result": {
                            "connect": {"id": resultEntity.id}
                        }
                    }
                )
    except:
        print(eventEntity.id, competition["title"],)
        eventEntity.falseData = True
        await db.event.update(where={"id": eventEntity.id}, data={"falseData": True})
        
    

    



async def create_participants():
    list_of_participants = []
    for competition in tqdm(competitions, desc="Creating participants"):
        results = competition["results"]
        for result in results:
            if result["name"] not in list_of_participants:
                participantEntity = await db.participant.create(
                    data={
                        "name": result["name"],
                        "club": result["club"],
                        "profileLink": result["profileLink"]
                    }
                )
                list_of_participants.append(participantEntity.name)
        
async def check_participants():
    participants = await db.participant.find_many()
    namesOfParticipants = [participant.name for participant in participants]
    notThere = 0
    for competition in competitions:
        results = competition["results"]
        for result in results:
            if result["name"] not in namesOfParticipants:
                print(result["name"])
                notThere += 1
    print(notThere)

async def create_results(results, eventEntity):
    for result in results:
        participantEntity = await db.participant.find_first(where={"name": result["name"]})
       
        resultEntity = await db.result.create(
            data={
                "event": {
                    "connect": {"id": eventEntity.id}
                },
                "participant": {
                    "connect": {"id": participantEntity.id}
                },
                "position": result["position"],
                "number": result["number"],
                "section": result["section"],
            }
        )

async def create_judges():
    list_of_judges = []
    for competition in tqdm(competitions, desc="Creating judges"):
        for judges in competition["judges"]:
            #print(list_of_judges)

            judgeName = "-".join(judges["name"].split("-"))
            if judges["name"] not in list_of_judges:
                judgeEntity = await db.judge.create(
                    data={
                        "name": judges["name"],
                        "location": judges["location"],
                        "link": judges["link"]
                    }
                )
                list_of_judges.append(judgeEntity.name)


async def check_judges():
    #check alll competitions that the judges are in the database
    judges = await db.judge.find_many()
    namesOfJudges = [judge.name for judge in judges]
    notThere = 0
    for competition in competitions:
        for judge in competition["judges"]:
            if judge["name"] not in namesOfJudges:
                print(judge["name"])
                notThere += 1
    print(notThere)
  
if __name__ == "__main__":
    asyncio.run(main())