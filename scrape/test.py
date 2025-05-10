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
import pandas as pd
import asyncio
from tqdm import tqdm

async def get_most_participated_events(db: Prisma, limit: int = 10) -> list[dict]:
    """
    Get the list of events with the most participants.
    
    Args:
        db: Prisma database instance
        limit: Number of top events to return (default: 10)
        
    Returns:
        List of dictionaries containing event details and participant count
    """
    # Get all events
    events = await db.event.find_many()
    
    # Initialize list to store results
    event_participants = []
    
    # Count participants for each event
    for event in tqdm(events, desc="Processing events"):
        # Count unique participants through results
        participant_count = await db.result.count(
            where={
                'eventId': event.id
            }
        )
        
        event_participants.append({
            'event_id': event.id,
            'event_name': event.name,
            'participant_count': participant_count
        })
    
    # Sort by participant count in descending order
    sorted_events = sorted(event_participants, key=lambda x: x['participant_count'], reverse=True)
    
    return sorted_events[:limit]

async def main():
    db = Prisma()
    await db.connect()
    
    # Get top 10 most participated events
    top_events = await get_most_participated_events(db)
    
    # Print results
    print("\nTop 10 Most Participated Events:")
    print("-" * 50)
    for event in top_events:
        print(f"Event: {event['event_name']}")
        print(f"Participants: {event['participant_count']}")
        print("-" * 50)
        
    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(main())







