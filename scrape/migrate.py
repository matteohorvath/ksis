import os
import json
import re
import asyncio
from prisma import Prisma
from prisma.models import Competition, Round, Judge, Pair, RoundJudge, RoundPair, Mark

from decimal import Decimal, InvalidOperation

# --- Configuration ---
DATA_DIR = os.path.join(os.path.dirname(__file__), 'competition_data')
# Example judge names - replace or enhance if actual names are available elsewhere
JUDGE_IDENTIFIERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

# --- Helper Functions ---
def extract_competition_id(filename):
    match = re.search(r'competition_marks_(\d+)\.json$', filename)
    return int(match.group(1)) if match else None

def parse_pair_info(pair_string):
    
    # split it on the first occasion where after a low cap letter there is a high cap and no space
    parts = re.split(r'(?<=[a-z])(?=[A-Z])', pair_string)
    name = parts[0].strip()
    club = parts[1].strip() if len(parts) > 1 else None
    return name, club

def parse_points(points_str):
    try:
        return Decimal(points_str)
    except (InvalidOperation, ValueError, TypeError):
        try:
            return Decimal(str(points_str).replace(',', '.'))
        except (InvalidOperation, ValueError, TypeError):
            return None # Return None if conversion fails

# --- Main Migration Logic ---
async def main():
    print("Starting migration...")
    db = Prisma()
    await db.connect()
    print(f"Connected to database.")

    files_processed = 0
    total_files = 0
    json_files = [f for f in os.listdir(DATA_DIR) if f.endswith('.json')]
    total_files = len(json_files)
    print(f"Found {total_files} JSON files in {DATA_DIR}")

    # Create dummy judges A, B, C... if they don't exist
    # In a real scenario, you might have actual judge names
    judge_map = {}
    for identifier in JUDGE_IDENTIFIERS:
         # Use a placeholder name if real names aren't available
        judge_name = f"Judge {identifier}"
        judge = await db.judge.upsert(
            where={'name': judge_name},
            data={
                'create': {'name': judge_name},
                'update': {},
            }
        )
        judge_map[identifier] = judge
        print(f"Upserted Judge {identifier} (ID: {judge.id})")


    for filename in json_files:
        comp_external_id = extract_competition_id(filename)
        if comp_external_id is None:
            print(f"Skipping file with invalid name format: {filename}")
            continue

        file_path = os.path.join(DATA_DIR, filename)
        print(f"\nProcessing {filename} (Competition External ID: {comp_external_id})...")

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except json.JSONDecodeError:
            print(f"Error decoding JSON from {filename}. Skipping.")
            continue
        except Exception as e:
            print(f"Error reading file {filename}: {e}. Skipping.")
            continue

        # 1. Create or update Competition
        competition_name = data.get('title', f"Competition {comp_external_id}")
        competition = await db.competition.upsert(
            where={'externalId': comp_external_id},
            data={
                'create': {'externalId': comp_external_id, 'name': competition_name},
                'update': {'name': competition_name},
            }
        )
        print(f"  Upserted Competition: {competition.name} (ID: {competition.id})")

        # 2. Process Sections as Rounds
        for section in data.get('sections', []):
            round_name = section.get('title')
            if not round_name:
                print("  Skipping section with no title.")
                continue

            # Create or update Round
            current_round = await db.round.upsert(
                where={'competitionId_name': {'competitionId': competition.id, 'name': round_name}},
                data={
                    'create': {'name': round_name, 'competitionId': competition.id},
                    'update': {},
                }
            )
            print(f"    Upserted Round: {current_round.name} (ID: {current_round.id})")

            headers = section.get('headers', [])
            rows = section.get('rows', [])
            if not headers or not rows:
                print(f"    Skipping round '{round_name}' due to missing headers or rows.")
                continue

            # Identify dance columns and active judges for this round
            dance_judge_map = {} # { 'Samba': ['A', 'B', 'C'], ... }
            round_active_judges = set()

            for header in headers:
                 # Simple check if header likely represents a dance with judges
                match = re.match(r"^(.*?)(" + "|".join(judge_map.keys()) + r")+$", header)
                if match:
                    dance_name = match.group(1)
                    judge_ids_str = header[len(dance_name):] # Get the 'ABCDE' part
                    if dance_name not in dance_judge_map:
                        dance_judge_map[dance_name] = []
                        # Link judges to this round if not already done
                        for judge_identifier in judge_ids_str:
                            if judge_identifier in judge_map:
                                judge = judge_map[judge_identifier]
                                await db.roundjudge.upsert(
                                    where={'roundId_judgeId': {'roundId': current_round.id, 'judgeId': judge.id}},
                                    data={
                                        'create': {
                                            'roundId': current_round.id,
                                            'judgeId': judge.id,
                                            'judgeIdentifier': judge_identifier
                                        },
                                        'update': {'judgeIdentifier': judge_identifier}, # Ensure identifier is correct
                                    }
                                )
                                dance_judge_map[dance_name].append(judge_identifier)
                                round_active_judges.add(judge_identifier)
                            else:
                                 print(f"      Warning: Judge identifier '{judge_identifier}' in header '{header}' not found in judge_map.")


            # 3. Process Rows (Pairs and Marks)
            for row_data in rows:
                pair_str = row_data.get('PárEgyesület')
                if not pair_str:
                    print("      Skipping row with missing 'PárEgyesület'.")
                    continue

                pair_name, pair_club = parse_pair_info(pair_str)

                # Use empty string as placeholder for None club for the unique constraint
                db_pair_club = pair_club if pair_club is not None else ""

                # Create or update Pair
                pair_unique_data = {'name': pair_name, 'club': db_pair_club}
                pair = await db.pair.upsert(
                    where={'name_club': pair_unique_data},
                    data={
                        'create': pair_unique_data,
                        'update': {},
                    }
                )
                # print(f"      Upserted Pair: {pair.name} (Club: {pair.club}) (ID: {pair.id})") # Can be verbose

                # Create or update RoundPair link
                place_str = row_data.get('Helyezés.')
                place = None
                if place_str:
                    place_match = re.match(r'^(\d+)', place_str)
                    if place_match:
                        place = int(place_match.group(1))

                points_str = row_data.get('Összesen')
                points_decimal = parse_points(points_str)
                # Explicitly convert points to float or None for Prisma
                points_float = float(points_decimal) if points_decimal is not None else None


                round_pair = await db.roundpair.upsert(
                    where={'roundId_pairId': {'roundId': current_round.id, 'pairId': pair.id}},
                    data={
                        'create': {
                            # Use connect syntax for relations
                            'round': {'connect': {'id': current_round.id}},
                            'pair': {'connect': {'id': pair.id}},
                            'place': place,
                            'points': points_float, # Use the float value
                        },
                        'update': {
                            'place': place,
                            'points': points_float, # Use the float value
                        },
                    }
                )
                # print(f"        Upserted RoundPair (ID: {round_pair.id}) Place: {place}, Points: {points}") # Verbose

                # Create Marks
                for dance_name, judge_identifiers in dance_judge_map.items():
                    header_name = dance_name + "".join(judge_identifiers) # Reconstruct header like "SambaABCDE"
                    marks_str = row_data.get(header_name)
                    if marks_str and len(marks_str) == len(judge_identifiers):
                        for i, judge_identifier in enumerate(judge_identifiers):
                            mark_value = marks_str[i]
                            if mark_value != '.': # Assuming '.' means no mark given
                                judge = judge_map.get(judge_identifier)
                                if judge:
                                    await db.mark.upsert(
                                        where={'roundPairId_judgeId': {
                                            'roundPairId': round_pair.id,
                                            'judgeId': judge.id
                                        }},
                                        data={
                                            'create': {
                                                'roundPairId': round_pair.id,
                                                'judgeId': judge.id,
                                                'markValue': mark_value,
                                            },
                                            'update': {
                                                'markValue': mark_value,
                                            },
                                        }
                                    )
                                    # print(f"          Upserted Mark: Judge {judge_identifier}, Dance {dance_name}, Mark {mark_value}") # Verbose
                                else:
                                    print(f"          Warning: Judge {judge_identifier} not found for mark in {filename} / {round_name}")
                    elif marks_str:
                         print(f"          Warning: Mark string '{marks_str}' length mismatch ({len(marks_str)}) for judges '{judge_identifiers}' ({len(judge_identifiers)}) in dance '{dance_name}' for header '{header_name}'")


        files_processed += 1
        print(f"  Finished processing {filename}. ({files_processed}/{total_files})")

    await db.disconnect()
    print(f"\nMigration finished. Processed {files_processed} files.")

if __name__ == '__main__':
    asyncio.run(main())
