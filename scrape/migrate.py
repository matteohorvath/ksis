# scrape/migrate.py
import json
import os
import asyncio
import re
import logging # Import logging
from datetime import datetime
from pathlib import Path
from tqdm.asyncio import tqdm # Import tqdm for async

# --- Logging Configuration ---
LOG_FILE = Path(__file__).parent / "migration.log"
logging.basicConfig(
    level=logging.WARNING, # Log WARNING level and above (suppresses INFO)
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, mode='w'), # Write to file, overwrite each run
        logging.StreamHandler() # Also print warnings/errors to console
    ]
)

# Assuming Prisma client is generated in ./generated/prisma relative to this script
# Adjust the import path if your generated client is elsewhere
try:
    from generated.prisma import Prisma, register
    from generated.prisma.models import (
        Competition, Judge, JudgeAssignment, Couple, Club, ParticipantResult,
        CompetitionMarks, Round, RoundMark, JudgeMark
    )
    from generated.prisma.errors import PrismaError
except ImportError:
    logging.error("Prisma client not found.") # Use logging
    logging.error("Please run 'prisma generate' in the 'scrape' directory.")
    logging.error("Make sure migrate.py is in the 'scrape' directory.")
    exit(1)

# --- Configuration ---
BASE_DATA_DIR = Path(__file__).parent / "competition_data"
RESULTS_DIR = BASE_DATA_DIR / "results"
DATABASE_URL = "file:./dev.db" # Matches schema.prisma

# --- Helper Functions ---
def extract_id_from_filename(filename):
    """Extracts the numeric ID from filenames like 'competition_marks_12345.json'"""
    match = re.search(r'_(\d+)\.json$', filename)
    return int(match.group(1)) if match else None

def parse_datetime_safe(date_str):
    """Safely parse date strings, return None if invalid."""
    if not date_str:
        return None
    try:
        # Add more formats if needed based on actual data variability
        return datetime.strptime(date_str, '%Y.%m.%d')
    except ValueError:
        logging.warning(f"Warning: Could not parse date '{date_str}'") # Use logging
        return None # Or handle as String if schema changes

async def upsert_competition(db: Prisma, comp_id: int, data: dict):
    """Upserts Competition details from results JSON."""
    # Handle potential missing keys gracefully
    counters_str = ", ".join(data.get('counters', [])) # Join list into a string

    # Safely get and convert participantCount
    raw_participant_count = data.get('participantCount')
    participant_count_int = None
    if raw_participant_count is not None:
        try:
            participant_count_int = int(raw_participant_count)
        except (ValueError, TypeError):
            logging.warning(f"Warning: Invalid participantCount '{raw_participant_count}' for Comp {comp_id}. Setting to null.")
            participant_count_int = None # Set to None if conversion fails

    await db.competition.upsert(
        where={'id': comp_id},
        data={
            'create': {
                'id': comp_id,
                'title': data.get('title', f'Competition {comp_id}'),
                # 'date': parse_datetime_safe(data.get('date')), # Uncomment if date is reliable
                'location': data.get('location'),
                'organizer': data.get('organizer'),
                'organizerRepresentative': data.get('organizerRepresentative'),
                'type': data.get('type'),
                'participantCount': participant_count_int, # Use validated value
                'commissioner': data.get('commissioner'),
                'supervisor': data.get('supervisor'),
                'announcer': data.get('announcer'),
                'counters': counters_str,
            },
            'update': {
                'title': data.get('title', f'Competition {comp_id}'),
                # 'date': parse_datetime_safe(data.get('date')),
                'location': data.get('location'),
                'organizer': data.get('organizer'),
                'organizerRepresentative': data.get('organizerRepresentative'),
                'type': data.get('type'),
                'participantCount': participant_count_int, # Use validated value
                'commissioner': data.get('commissioner'),
                'supervisor': data.get('supervisor'),
                'announcer': data.get('announcer'),
                'counters': counters_str,
            }
        }
    )

async def upsert_judges(db: Prisma, comp_id: int, judges_data: list):
    """Upserts Judges and their assignments for a competition."""
    judge_assignments = []
    for judge_info in judges_data:
        if not judge_info.get('name') or not judge_info.get('id'):
            logging.warning(f"Warning: Skipping judge with missing name or id in Competition {comp_id}: {judge_info}")
            continue

        judge = await db.judge.upsert(
            where={'name': judge_info['name']},
            data={
                'create': {
                    'name': judge_info['name'],
                    'location': judge_info.get('location'),
                    'link': judge_info.get('link'),
                },
                'update': {
                    'location': judge_info.get('location'),
                    'link': judge_info.get('link'),
                }
            }
        )
        assignment = await db.judgeassignment.upsert(
            where={'competitionId_judgeLetter': {'competitionId': comp_id, 'judgeLetter': judge_info['id']}},
            data={
                'create': {
                    'competitionId': comp_id,
                    'judgeId': judge.id,
                    'judgeLetter': judge_info['id'],
                },
                'update': { # Update judgeId if somehow the letter pointed elsewhere before
                     'judgeId': judge.id,
                }
            }
        )
        judge_assignments.append(assignment)
    return judge_assignments


async def upsert_participants(db: Prisma, comp_id: int, participants_data: list):
    """Upserts Couples, Clubs, and ParticipantResults for a competition."""
    count = 0
    for participant_info in participants_data:
        couple_name = participant_info.get('name')
        club_name = participant_info.get('club')
        start_number = participant_info.get('number')

        if not couple_name or not club_name or not start_number:
            logging.warning(f"Warning: Skipping participant with missing name, club, or number in Competition {comp_id}: {participant_info}")
            continue

        couple = await db.couple.upsert(
            where={'name': couple_name},
            data={'create': {'name': couple_name}, 'update': {}}
        )
        club = await db.club.upsert(
            where={'name': club_name},
            data={'create': {'name': club_name}, 'update': {}}
        )

        await db.participantresult.upsert(
             where={'competitionId_number': {'competitionId': comp_id, 'number': start_number}},
             data={
                 'create': {
                     'competitionId': comp_id,
                     'coupleId': couple.id,
                     'clubId': club.id,
                     'number': start_number,
                     'position': participant_info.get('position'),
                     'section': participant_info.get('section'),
                     'profileLink': participant_info.get('profileLink'),
                 },
                 'update': {
                     'coupleId': couple.id, # Ensure links are correct if number existed
                     'clubId': club.id,
                     'position': participant_info.get('position'),
                     'section': participant_info.get('section'),
                     'profileLink': participant_info.get('profileLink'),
                 }
             }
        )
        count += 1
    return count

async def upsert_competition_marks(db: Prisma, comp_id: int, data: dict):
    """Upserts CompetitionMarks details from main data JSON."""
    # Ensure the Competition record exists first
    competition = await db.competition.find_unique(where={'id': comp_id})
    if not competition:
        logging.error(f"Error: Competition {comp_id} not found in database. Skipping marks processing.")
        # Optionally, create a basic competition entry here if desired
        # await db.competition.create(data={'id': comp_id, 'title': data.get('title', f'Competition {comp_id} - Marks')})
        return None # Return None explicitly on error

    comp_marks = await db.competitionmarks.upsert(
        where={'competitionId': comp_id},
        data={
            'create': {
                'id': comp_id, # Use same ID
                'competitionId': comp_id,
                'title': data.get('title', f'Marks for Competition {comp_id}'),
            },
            'update': {
                 'title': data.get('title', f'Marks for Competition {comp_id}'),
            }
        }
    )
    return comp_marks

async def upsert_rounds_and_marks(db: Prisma, comp_marks: CompetitionMarks, sections_data: list, judge_assignments: list[JudgeAssignment]):
    """Upserts Rounds, RoundMarks, and JudgeMarks."""
    judge_assignment_map = {ja.judgeLetter: ja.id for ja in judge_assignments}
    round_order = 0
    for section in sections_data:
        round_order += 1
        round_title = section.get('title')
        headers = section.get('headers', [])
        rows = section.get('rows', [])

        if not round_title or not headers or not rows:
            logging.warning(f"Warning: Skipping section with missing title, headers, or rows in CompetitionMarks {comp_marks.id}: {round_title}")
            continue

        # Create or find the Round
        db_round = await db.round.upsert(
            where={'competitionMarksId_title': {'competitionMarksId': comp_marks.id, 'title': round_title}},
            data={
                'create': {
                    'competitionMarksId': comp_marks.id,
                    'title': round_title,
                    'order': round_order,
                },
                'update': {
                    'order': round_order, # Update order if it changes
                }
            }
        )

        # Identify dance columns and their judge letters
        dance_columns = {}
        for header in headers:
            if '/' in header:
                parts = header.split('/', 1)
                dance_name = parts[0].strip()
                judge_letters = parts[1].strip() if len(parts) > 1 else ""
                dance_columns[header] = {'name': dance_name, 'letters': judge_letters}

        # Process each participant's row in the round
        for row_data in rows:
            participant_number = row_data.get('FordulóRsz.')
            if not participant_number:
                logging.warning(f"Warning: Skipping row with missing participant number in Round {round_title}, Comp {comp_marks.id}")
                continue

            # Check if participant exists (it should have been created from results files)
            participant_result = await db.participantresult.find_unique(
                where={'competitionId_number': {'competitionId': comp_marks.competitionId, 'number': participant_number}}
            )
            if not participant_result:
                 logging.warning(f"Warning: ParticipantResult not found for Comp {comp_marks.competitionId}, Num {participant_number}. Skipping marks for this participant in Round {round_title}.")
                 continue

            # Process marks for each dance in this row
            for header, dance_info in dance_columns.items():
                if header not in row_data:
                    # logging.debug(f"Debug: Header '{header}' not in row data for participant {participant_number}, round {round_title}")
                    continue # Skip if this dance wasn't performed or recorded for this participant

                marks_string = row_data.get(header)
                dance_name = dance_info['name']
                judge_letters_str = dance_info['letters']

                # Create or find the RoundMark entry
                round_mark_entry = await db.roundmark.upsert(
                    where={'roundId_participantNumber_danceName': {
                        'roundId': db_round.id,
                        'participantNumber': participant_number,
                        'danceName': dance_name
                    }},
                    data={
                        'create': {
                            'roundId': db_round.id,
                            'competitionId': comp_marks.competitionId,
                            'participantNumber': participant_number,
                            'danceName': dance_name,
                            'totalScore': row_data.get('Összesen'),
                            'placementInRound': row_data.get('Helyezés.'),
                            'advancement': row_data.get('Tovább'),
                        },
                        'update': {
                            'totalScore': row_data.get('Összesen'),
                            'placementInRound': row_data.get('Helyezés.'),
                            'advancement': row_data.get('Tovább'),
                        }
                    }
                )

                # Process individual judge marks if available
                if marks_string and judge_letters_str and len(marks_string) == len(judge_letters_str):
                    judge_marks_to_create = []
                    for i, judge_letter in enumerate(judge_letters_str):
                        mark_char = marks_string[i]
                        judge_assignment_id = judge_assignment_map.get(judge_letter)

                        if judge_assignment_id:
                            # Use upsert for individual judge marks
                             await db.judgemark.upsert(
                                 where={'roundMarkId_judgeAssignmentId': {
                                     'roundMarkId': round_mark_entry.id,
                                     'judgeAssignmentId': judge_assignment_id
                                 }},
                                 data={
                                     'create': {
                                         'roundMarkId': round_mark_entry.id,
                                         'judgeAssignmentId': judge_assignment_id,
                                         'mark': mark_char,
                                     },
                                     'update': {
                                          'mark': mark_char, # Update if mark changes
                                     }
                                 }
                             )
                        else:
                            logging.warning(f"Warning: Judge Assignment ID not found for letter '{judge_letter}' in Comp {comp_marks.competitionId}")
                # else:
                    # logging.debug(f"Debug: Skipping individual judge marks for {participant_number}, {dance_name}, Round {round_title}. Reason: Mismatched lengths or missing data. Marks: '{marks_string}', Letters: '{judge_letters_str}'")


# --- Main Execution ---
async def main():
    """Main function to orchestrate the data migration."""
    db = Prisma(datasource={"url": DATABASE_URL})
    try:
        await db.connect()
        logging.info("Connected to database.") # Log info

        processed_competitions = {} # Store judge assignments for marks processing

        # 1. Process Results Files
        logging.info(f"\n--- Processing Results Files in {RESULTS_DIR} ---")
        if not RESULTS_DIR.is_dir():
            logging.error(f"Error: Results directory not found: {RESULTS_DIR}")
        else:
            results_files = [f for f in os.listdir(RESULTS_DIR) if f.endswith(".json")]
            # Wrap the loop with tqdm.asyncio.tqdm
            for filename in tqdm(results_files, desc="Processing Results", unit="file"):
                comp_id = extract_id_from_filename(filename)
                if comp_id is None:
                    logging.warning(f"\nWarning: Could not extract ID from results filename: {filename}")
                    continue

                filepath = RESULTS_DIR / filename
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        data = json.load(f)

                    await upsert_competition(db, comp_id, data)
                    judge_assignments = await upsert_judges(db, comp_id, data.get('judges', []))
                    processed_competitions[comp_id] = judge_assignments # Store for later use
                    await upsert_participants(db, comp_id, data.get('results', []))

                except json.JSONDecodeError:
                    logging.error(f"\nError: Invalid JSON in file: {filepath}") # Added newline for tqdm clarity
                except PrismaError as e:
                    logging.error(f"\nPrisma Error processing {filepath}: {e}") # Added newline
                except Exception as e:
                    logging.error(f"\nUnexpected Error processing {filepath}: {e}", exc_info=True) # Added newline

        # 2. Process Marks Files
        logging.info(f"\n--- Processing Marks Files in {BASE_DATA_DIR} ---")
        if not BASE_DATA_DIR.is_dir():
            logging.error(f"Error: Base data directory not found: {BASE_DATA_DIR}")
        else:
            marks_files = []
            for filename in os.listdir(BASE_DATA_DIR):
                filepath = BASE_DATA_DIR / filename
                if not filepath.is_dir() and filename.endswith(".json"):
                     marks_files.append(filename)

            # Wrap the loop with tqdm.asyncio.tqdm
            for filename in tqdm(marks_files, desc="Processing Marks", unit="file"):
                comp_id = extract_id_from_filename(filename)
                if comp_id is None:
                    logging.warning(f"\nWarning: Could not extract ID from marks filename: {filename}")
                    continue

                if comp_id not in processed_competitions:
                    # Use tqdm.write for messages within a tqdm loop to avoid breaking the bar
                    logging.warning(f"Warning: Skipping marks file {filename} because no corresponding results file was processed (or had judges).")
                    continue

                judge_assignments_for_marks = processed_competitions[comp_id]
                filepath = BASE_DATA_DIR / filename # Define filepath here

                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        data = json.load(f)

                    # Ensure CompetitionMarks is linked correctly
                    comp_marks = await upsert_competition_marks(db, comp_id, data)
                    if comp_marks:
                        await upsert_rounds_and_marks(db, comp_marks, data.get('sections', []), judge_assignments_for_marks)

                except json.JSONDecodeError:
                    logging.error(f"\nError: Invalid JSON in file: {filepath}") # Added newline
                except PrismaError as e:
                    logging.error(f"\nPrisma Error processing {filepath}: {e}") # Added newline
                except Exception as e:
                    logging.error(f"\nUnexpected Error processing {filepath}: {e}", exc_info=True) # Added newline

        logging.info("\n--- Migration Finished ---") # Log info

    except Exception as e:
        logging.critical(f"A critical error occurred during migration: {e}", exc_info=True)
    finally:
        if db.is_connected():
            await db.disconnect()
            logging.info("Disconnected from database.") # Log info

if __name__ == "__main__":
    # Register the Prisma client (important for standalone scripts)
    register(Prisma())
    asyncio.run(main())
