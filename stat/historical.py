# read in the sqlite db from dev.db
import sqlite3
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import argparse

# --- Configuration ---
TARGET_COMPETITION_ID = 580 # Set the main competition ID here
# --- End Configuration ---

# --- Argument Parsing ---
def parse_args():
    parser = argparse.ArgumentParser(description="Plot participant performance over time.")
    parser.add_argument("-ly", "--last-year-only", action="store_true", 
                        help="If set, only show results from the last 365 days relative to TARGET_COMPETITION_ID's date.")
    parser.add_argument("-tn", "--top-n", type=int, metavar='N', default=None,
                        help="If set, only show results for the top N participants based on their performance in TARGET_COMPETITION_ID.")
    return parser.parse_args()

args = parse_args()
# --- End Argument Parsing ---

conn = sqlite3.connect('dev.db')
cursor = conn.cursor()

# --- Determine Date Range for Filtering (if applicable) ---
filter_active = False
one_year_ago_date = None
filter_message = "(All Time)"

if args.last_year_only:
    print(f"--last-year-only specified. Attempting to filter based on date of competition ID {TARGET_COMPETITION_ID}.")
    cursor.execute("SELECT date FROM Competition WHERE id = ?", (TARGET_COMPETITION_ID,))
    target_comp_data = cursor.fetchone()
    if target_comp_data and target_comp_data[0]:
        target_comp_date_str = target_comp_data[0]
        parsed_target_comp_date = None
        # Use the same flexible date parsing as for results
        possible_formats = [
            "%Y.%m.%d", "%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d", "%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%S"
        ]
        for fmt in possible_formats:
            try:
                parsed_target_comp_date = datetime.strptime(target_comp_date_str, fmt)
                break
            except (ValueError, TypeError):
                continue
        
        if parsed_target_comp_date:
            one_year_ago_date = parsed_target_comp_date - timedelta(days=365)
            filter_active = True
            filter_message = f"(Last 365 Days from Comp {TARGET_COMPETITION_ID} Date: {parsed_target_comp_date.strftime('%Y-%m-%d')})"
            print(f"Reference date for filtering: {parsed_target_comp_date.strftime('%Y-%m-%d')}. Filtering results from {one_year_ago_date.strftime('%Y-%m-%d')}.")
        else:
            print(f"Warning: Could not parse date ('{target_comp_date_str}') for competition ID {TARGET_COMPETITION_ID}. 'Last year only' filter will not be fully effective.")
    else:
        print(f"Warning: Could not find competition ID {TARGET_COMPETITION_ID} or it has no date. 'Last year only' filter will not be fully effective.")
else:
    print("Showing all historical results (no --last-year-only flag).")
# --- End Date Range Determination ---

# Query to retrieve participants from the TARGET_COMPETITION_ID
participants_query = f"""
SELECT DISTINCT p.id, p.name
FROM participants p
JOIN Result res ON p.id = res.participantId
JOIN Event e ON res.eventId = e.id
WHERE e.competitionId = {TARGET_COMPETITION_ID}
"""

cursor.execute(participants_query)
participants_in_competition = cursor.fetchall()

# --- Top N Filtering (if applicable) ---
if args.top_n is not None and args.top_n > 0 and participants_in_competition:
    print(f"--top-n {args.top_n} specified. Determining top participants from competition ID {TARGET_COMPETITION_ID}.")
    ranked_participants_for_top_n = []

    for p_id, p_name in participants_in_competition:
        # Query to get results specifically within TARGET_COMPETITION_ID for this participant
        top_n_ranking_query = """
        SELECT
            res.position,
            (SELECT COUNT(DISTINCT r_sub.participantId)
             FROM Result r_sub
             WHERE r_sub.eventId = res.eventId) AS total_participants_in_event
        FROM Result res
        JOIN Event e ON res.eventId = e.id
        WHERE res.participantId = ? AND e.competitionId = ?;
        """
        cursor.execute(top_n_ranking_query, (p_id, TARGET_COMPETITION_ID))
        results_in_target_comp = cursor.fetchall()
        
        best_relative_position_in_target_comp = float('inf') # Default to worst possible

        if results_in_target_comp:
            current_participant_relative_positions = []
            for pos_str, total_in_event in results_in_target_comp:
                cleaned_pos_str = pos_str.strip()
                if ' - ' in cleaned_pos_str:
                    cleaned_pos_str = cleaned_pos_str.split(' - ')[0]
                if cleaned_pos_str.endswith('.'):
                    cleaned_pos_str = cleaned_pos_str[:-1]
                try:
                    pos_val = int(cleaned_pos_str)
                    if total_in_event > 0:
                        current_participant_relative_positions.append(float(pos_val) / total_in_event)
                except ValueError:
                    continue # Skip if position is not convertible
            
            if current_participant_relative_positions:
                best_relative_position_in_target_comp = min(current_participant_relative_positions)
        
        ranked_participants_for_top_n.append((p_id, p_name, best_relative_position_in_target_comp))

    # Sort by their best relative position in TARGET_COMPETITION_ID (ascending)
    ranked_participants_for_top_n.sort(key=lambda x: x[2])
    
    # Slice to get the top N
    top_n_filtered_participants = ranked_participants_for_top_n[:args.top_n]
    
    if len(top_n_filtered_participants) < len(participants_in_competition):
        print(f"Filtered to top {len(top_n_filtered_participants)} participants based on performance in competition {TARGET_COMPETITION_ID}.")
    
    participants_in_competition = [(pid, pname) for pid, pname, score in top_n_filtered_participants] # Keep only id and name for the main loop
    
    if args.top_n and filter_message == "(All Time)": # If only top-n is active
        filter_message = f"(Top {args.top_n} from Comp {TARGET_COMPETITION_ID})"
    elif args.top_n: # If --last-year-only is also active
         filter_message += f" & Top {args.top_n}"

# --- End Top N Filtering ---

if not participants_in_competition:
    print(f"No participants found for competition ID {TARGET_COMPETITION_ID} or after applying filters. Exiting.")
    conn.close()
    exit()

# Initialize the plot
plt.figure(figsize=(14, 8))
plotted_anything = False

print(f"Processing and plotting previous results for participants in competitionId {TARGET_COMPETITION_ID}:") # Used TARGET_COMPETITION_ID

for p_id, p_name in participants_in_competition:
    print(f"  Processing results for {p_name} (ID: {p_id})...")
    
    # Query to get all results for a specific participant, including date and total participants for relative position
    results_query = """
    SELECT
        c.date AS competition_date,
        res.position,
        (SELECT COUNT(DISTINCT r_sub.participantId)
         FROM Result r_sub
         WHERE r_sub.eventId = res.eventId) AS total_participants_in_event
    FROM Result res
    JOIN Event e ON res.eventId = e.id
    JOIN Competition c ON e.competitionId = c.id
    WHERE res.participantId = ?
    ORDER BY c.date;
    """
    
    cursor.execute(results_query, (p_id,))
    all_results_for_participant = cursor.fetchall()
    
    # Filter results if --last-year-only is set and one_year_ago_date is determined
    if filter_active and one_year_ago_date and all_results_for_participant:
        filtered_results = []
        for row_data in all_results_for_participant:
            date_str_for_filter = row_data[0] # competition_date is the first element
            parsed_date_for_filter = None
            possible_formats_for_filter = [
                "%Y.%m.%d", "%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%d %H:%M:%S", 
                "%Y-%m-%d", "%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%S"
            ]
            for fmt in possible_formats_for_filter:
                try:
                    parsed_date_for_filter = datetime.strptime(date_str_for_filter, fmt)
                    break
                except (ValueError, TypeError):
                    continue
            
            if parsed_date_for_filter and parsed_date_for_filter >= one_year_ago_date and parsed_date_for_filter <= parsed_target_comp_date:
                filtered_results.append(row_data)
            elif parsed_date_for_filter:
                pass # Date is older than one year, skip
            # else: date was unparseable for filtering, will be handled later by main parsing logic
        
        if len(filtered_results) < len(all_results_for_participant):
            print(f"    Filtered {p_name}'s results from {len(all_results_for_participant)} to {len(filtered_results)} for last year.")
        all_results_for_participant = filtered_results

    dates = []
    relative_positions = []
    
    if all_results_for_participant:
        # print(f"    Found {len(all_results_for_participant)} raw results for {p_name}.") # Commented out
        for i, row in enumerate(all_results_for_participant):
            competition_date_str, position_str, total_participants = row
            # print(f"      Raw result {i+1}: DateStr='{competition_date_str}', PosStr='{position_str}', TotalInEvent={total_participants}") 

            if competition_date_str is None or total_participants is None or total_participants == 0:
                # print(f"    Skipping result for {p_name} due to missing date or zero/None total participants: Date='{competition_date_str}', TotalInEvent='{total_participants}'") 
                continue
            
            cleaned_position_str = position_str.strip()
            if ' - ' in cleaned_position_str: 
                cleaned_position_str = cleaned_position_str.split(' - ')[0]
            if cleaned_position_str.endswith('.'):
                cleaned_position_str = cleaned_position_str[:-1]
            
            try:
                position = int(cleaned_position_str)
            except ValueError:
                # print(f"    Skipping result for {p_name} due to non-numeric position after cleaning: '{position_str}' (cleaned to '{cleaned_position_str}')") # Commented out
                continue

            parsed_date = None
            # Attempt to parse various common date/datetime formats
            # The Competition.date field is TEXT, so we need to be flexible.
            possible_formats = [
                "%Y.%m.%d", # Added for YYYY.MM.DD format observed in logs
                "%Y-%m-%d %H:%M:%S.%f", 
                "%Y-%m-%d %H:%M:%S", 
                "%Y-%m-%d",
                "%Y-%m-%dT%H:%M:%S.%fZ", # ISO 8601 with Z for UTC
                "%Y-%m-%dT%H:%M:%S"      # ISO 8601 without Z
            ]
            for fmt in possible_formats:
                try:
                    parsed_date = datetime.strptime(competition_date_str, fmt)
                    # print(f"      Successfully parsed date '{competition_date_str}' with format '{fmt}'") # Commented out
                    break 
                except (ValueError, TypeError):
                    continue
            
            if parsed_date is None:
                # print(f"    Skipping result for {p_name} due to unparseable date: '{competition_date_str}' (tried formats: {possible_formats})") # Commented out
                continue
                
            current_relative_position = float(position) / total_participants
            dates.append(parsed_date)
            relative_positions.append(current_relative_position)
            print(f"    Calculated point for {p_name}: Date={parsed_date.strftime('%Y-%m-%d')}, Position={position}, TotalInEvent={total_participants}, Relative Position={current_relative_position:.3f}") # Updated print
        
        if dates and relative_positions:
            # Sort by date to ensure lines are drawn chronologically
            sorted_data = sorted(zip(dates, relative_positions))
            plot_dates, plot_relative_positions = zip(*sorted_data)
            
            plt.plot(plot_dates, plot_relative_positions, marker='o', linestyle='-', label=f'{p_name}')
            plotted_anything = True
            print(f"    Plotted {len(plot_dates)} points for {p_name}.")
        else:
            print(f"    No plottable results found for {p_name}.")
    else:
        print(f"    No historical results found for {p_name}.")

# After the loop, configure and show the plot if anything was plotted
if plotted_anything:
    plt.xlabel("Date of Competition")
    plt.ylabel("Relative Position (Position / Total Participants in Event)")
    plt.title(f"Participants' Performance Over Time (Competition {TARGET_COMPETITION_ID}) {filter_message}") # Used TARGET_COMPETITION_ID and updated filter_message
    plt.legend(loc='best')
    plt.xticks(rotation=45, ha='right')
    plt.grid(True, linestyle='--', alpha=0.7)
    plt.tight_layout() # Adjust layout to make room for rotated x-axis labels and legend
    plt.show()
else:
    print("\nNo data available to plot for any participant.")

conn.close()



