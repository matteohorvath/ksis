import pandas as pd

# --- Configuration ---
# SET THE PARTICIPANT ID YOU WANT TO SCORE HERE
target_participant_id = 2038 # Example: Change this to the ID you're interested in
# --- End Configuration ---

# Load the relevant CSV files
try:
    mark_df = pd.read_csv('csv/Mark.csv')
    round_df = pd.read_csv('csv/Round.csv')
    result_df = pd.read_csv('csv/Result.csv')
    try:
        participants_df = pd.read_csv('csv/participants.csv')
    except FileNotFoundError:
        participants_df = None
        print("participants.csv not found, participant names will not be shown.")
    try:
        judges_df = pd.read_csv('csv/judges.csv')
    except FileNotFoundError:
        judges_df = None
        print("judges.csv not found, judge names will not be shown for judge scores.")
except FileNotFoundError as e:
    print(f"Error: {e}. Make sure the CSV files are in the 'csv' directory.")
    exit()

# Filter for non-final rounds
# In Round.csv, 'name' column contains round names like 'Döntő' (Final), 'Elődöntő' (Semifinal)
# We need to identify rounds that are not 'Döntő'
non_final_round_ids = round_df[round_df['name'] != 'Döntő']['id']

# Filter marks for non-final rounds
mark_df_non_final = mark_df[mark_df['roundId'].isin(non_final_round_ids)]

# Determine if a participant advanced to the next round for each event
# We'll use Result.csv. If a participant appears in a 'Döntő' section for an event, they advanced.
# Or, more generally, if a participant's result entry is for a later stage than another participant
# for the same event, they advanced further.
# For simplicity in this step, let's define "advanced" as reaching *any* round beyond the one being judged.
# A more precise way would be to check if they reached the *next* specific round.

# We need to know for each participant in a specific round of an event, did they advance to *any* later round in that *same event*?
# Result.csv links participantId, eventId, and the section (round name) they reached.
# Mark.csv links participantId, roundId, judgeId, and the mark (X).
# Round.csv links roundId to eventId and round name.

# 1. Merge mark_df_non_final with round_df to get eventId and round_name for each mark
mark_details_df = pd.merge(mark_df_non_final, round_df, left_on='roundId', right_on='id', suffixes=('_mark', '_round'))
mark_details_df = mark_details_df.rename(columns={'name': 'round_name_judged', 'id_round': 'round_id_actual', 'eventId_mark': 'eventId'}) # ensure eventId is consistently named
if 'eventId_round' in mark_details_df.columns and 'eventId' not in mark_details_df.columns: # handle suffix case for eventId
    mark_details_df.rename(columns={'eventId_round': 'eventId'}, inplace=True)


# 2. For each participant and event, find the "latest" round they reached from Result.csv
# To do this, we need a hierarchy for round names (e.g., Elődöntő is "later" than 1.Forduló)
# For now, let's consider any round that is not the one being judged and is part of the same event as "advancing".
# And specifically, if they reached 'Döntő' in that event, they definitely advanced past pre-finals.

result_df['reached_final'] = result_df['section'] == 'Döntő'
participant_event_advancement = result_df.groupby(['participantId', 'eventId'])['reached_final'].any().reset_index(name='advanced_to_final_overall')


# 3. Merge this advancement information back to our detailed marks table
# We need eventId in mark_details_df (which we got from merging with Round.csv)
# And we need participantId
mark_details_df = pd.merge(mark_details_df, participant_event_advancement,
                               on=['participantId', 'eventId'],
                               how='left')

# If a participant is not in participant_event_advancement for a given event,
# it means they didn't have a result recorded in Result.csv for that event,
# or they didn't make it to a final in that event.
# We'll assume NaN means they didn't advance to the final for that event.
mark_details_df['advanced_to_final_overall'] = mark_details_df['advanced_to_final_overall'].fillna(False)


# Calculate scores
# Score +1: Judge gave X (mark=1), participant did NOT advance to final overall for that event.
# Score 0: Judge gave X (mark=1), participant DID advance. OR Judge did NOT give X (mark=0), participant did NOT advance.
# Score -1: Judge did NOT give X (mark=0), participant DID advance.

def calculate_score(row):
    judge_gave_x = row['mark'] == 1
    participant_advanced = row['advanced_to_final_overall']

    if judge_gave_x and not participant_advanced:
        return 1
    elif (judge_gave_x and participant_advanced) or (not judge_gave_x and not participant_advanced):
        return 0
    elif not judge_gave_x and participant_advanced:
        return -1
    return 0 # Should not happen given the conditions

mark_details_df['judge_score_contribution'] = mark_details_df.apply(calculate_score, axis=1)

# Sum scores per judge
judge_scores = mark_details_df.groupby('judgeId')['judge_score_contribution'].sum().reset_index()

# Optional: Merge with judge names for readability
if judges_df is not None:
    judge_scores = pd.merge(judge_scores, judges_df[['id', 'name']], left_on='judgeId', right_on='id', how='left')
    judge_scores = judge_scores[['judgeId', 'name', 'judge_score_contribution']] # Reorder and select columns
else:
    judge_scores = judge_scores[['judgeId', 'judge_score_contribution']]


print("Judge Scores for Non-Final Rounds:")
print(judge_scores.sort_values(by='judge_score_contribution', ascending=False))

# Further refinement could be to check advancement *specifically* to the *next* round,
# rather than just "reached final overall".
# This would require ordering the rounds within an event.
# For example, if judging "Elődöntő", did they make it to "Döntő" in that event?
# If judging "1.Forduló", did they make it to "Elődöntő" or "Döntő" in that event?

# To implement "advancement to the next specific round":
# 1. Define a hierarchy/order for round names.
round_order = {
    # Lower numbers mean earlier rounds
    "0.Forduló": 0,        # Earliest round seen in data
    "Reményfutam után": 1, # "After repechage", likely very early
    "Redance": 2,          # Kept for now, can be removed if never occurs
    "1.Forduló": 3,
    "2.Forduló": 4,
    "3.Forduló": 5,
    "4.Forduló": 6,
    "5.Forduló": 7,
    "6.Forduló": 8,
    # Assuming higher "Forduló" numbers are later, adjust if needed based on actual competition structure
    "9.Forduló": 9,
    "11.Forduló": 10, # Assuming 11th round is after 9th
    "Negyeddöntő": 11,    # Quarterfinal, kept for now
    "Elődöntő": 12,       # Semifinal
    "Döntő": 13           # Final
}
# Add any other round names present in your data to this dictionary with appropriate order

# Map round names to their order in both mark_details_df (for the judged round)
# and result_df (for the rounds reached by participants)
mark_details_df['judged_round_order'] = mark_details_df['round_name_judged'].map(round_order)
result_df['reached_round_order'] = result_df['section'].map(round_order)

# For each participant and event, find the maximum round order they reached
participant_max_round_reached = result_df.groupby(['participantId', 'eventId'])['reached_round_order'].max().reset_index(name='max_reached_round_order')

# Merge this back to mark_details_df
mark_details_advanced_check_df = pd.merge(mark_details_df.drop(columns=['advanced_to_final_overall']), # remove previous advancement logic
                                          participant_max_round_reached,
                                          on=['participantId', 'eventId'],
                                          how='left')

# If max_reached_round_order is NaN, it means the participant wasn't found in results for that event or their round names were not in round_order.
# Assume they didn't advance past the judged round.
mark_details_advanced_check_df['max_reached_round_order'] = mark_details_advanced_check_df['max_reached_round_order'].fillna(-1) # -1 to be less than any valid round_order

# Now, determine if participant advanced *beyond* the currently judged round within the same event
mark_details_advanced_check_df['advanced_past_judged_round'] = mark_details_advanced_check_df['max_reached_round_order'] > mark_details_advanced_check_df['judged_round_order']

# Recalculate scores with this new advancement logic
def calculate_score_refined(row):
    judge_gave_x = row['mark'] == 1
    participant_advanced_specifically = row['advanced_past_judged_round']

    # it should be +1 if the judge gave them a higher valuation in the prefinal rounds,
    # meaning they got an X and they didnt get to the next round.
    if judge_gave_x and not participant_advanced_specifically:
        return 1
    # it should be 0 if the judgement and the outcome of the round is the same.
    elif (judge_gave_x and participant_advanced_specifically) or (not judge_gave_x and not participant_advanced_specifically):
        return 0
    # should be minus if they got lower meaning they got into the round but the judge didnt gave them an X
    elif not judge_gave_x and participant_advanced_specifically:
        return -1
    return 0 # Default / Should not happen

mark_details_advanced_check_df['judge_score_contribution_refined'] = mark_details_advanced_check_df.apply(calculate_score_refined, axis=1)

# Sum refined scores per judge
judge_scores_refined = mark_details_advanced_check_df.groupby('judgeId')['judge_score_contribution_refined'].sum().reset_index()

# Optional: Merge with judge names for readability
if judges_df is not None:
    judge_scores_refined = pd.merge(judge_scores_refined, judges_df[['id', 'name']], left_on='judgeId', right_on='id', how='left')
    judge_scores_refined = judge_scores_refined[['judgeId', 'name', 'judge_score_contribution_refined']]
else:
    judge_scores_refined = judge_scores_refined[['judgeId', 'judge_score_contribution_refined']]


print("\n\nRefined Judge Scores (based on advancing past the specific judged round):")
print(judge_scores_refined.sort_values(by='judge_score_contribution_refined', ascending=False))

# Save the results to a CSV file
output_filename = "judge_liking_scores.csv"
judge_scores_refined.to_csv(output_filename, index=False)
print(f"\nRefined scores saved to {output_filename}")

# Example: How to check a specific participant's journey and a judge's marks for them
# participant_id_to_check = 5 # Example participant ID
# judge_id_to_check = 1 # Example judge ID

# print(f"\nDetails for Participant {participant_id_to_check} and Judge {judge_id_to_check} in non-final rounds:")
# specific_marks = mark_details_advanced_check_df[
#     (mark_details_advanced_check_df['participantId'] == participant_id_to_check) &
#     (mark_details_advanced_check_df['judgeId'] == judge_id_to_check)
# ]
# print(specific_marks[[
#     'roundId', 'round_name_judged', 'judged_round_order', 'mark', 'eventId',
#     'max_reached_round_order', 'advanced_past_judged_round', 'judge_score_contribution_refined'
# ]])

# print(f"\nResults for Participant {participant_id_to_check} across all their events:")
# print(result_df[result_df['participantId'] == participant_id_to_check][['eventId', 'section', 'reached_round_order', 'position']])

# To make this fully robust, ensure all round names from Round.csv and Result.csv are in the round_order dictionary.
# You can get unique round names like this:
# print("\nUnique round names in Mark/Round data:", mark_details_advanced_check_df['round_name_judged'].unique())
# print("Unique round names in Result data:", result_df['section'].unique())
# Add any missing ones to round_order mapping.
# For rounds not in the map, they might get NaN for order and affect 'advanced_past_judged_round' logic.
# Defaulting NaN to -1 for max_reached and fillna(-2) for judged_round should generally lead to
# 'advanced_past_judged_round' being False if judged_round_order is unmapped, which is a safe default.

# Final check on score calculation for unmapped rounds
# If 'judged_round_order' is -2 (unmapped), and 'max_reached_round_order' is -1 (participant not in results or unmapped)
# 'advanced_past_judged_round' -> -1 > -2 -> True. This might be an issue.
# It's better to filter out rows where judged_round_order could not be determined.
valid_judged_rounds_df = mark_details_advanced_check_df[mark_details_advanced_check_df['judged_round_order'] != -2].copy() # Use .copy() to avoid SettingWithCopyWarning

# Recalculate scores with this new advancement logic on the filtered dataframe
valid_judged_rounds_df['judge_score_contribution_refined'] = valid_judged_rounds_df.apply(calculate_score_refined, axis=1)

# Sum refined scores per judge from the valid_judged_rounds_df
judge_scores_final_refined = valid_judged_rounds_df.groupby('judgeId')['judge_score_contribution_refined'].sum().reset_index()

# Optional: Merge with judge names for readability
if judges_df is not None:
    judge_scores_final_refined = pd.merge(judge_scores_final_refined, judges_df[['id', 'name']], left_on='judgeId', right_on='id', how='left')
    judge_scores_final_refined = judge_scores_final_refined[['judgeId', 'name', 'judge_score_contribution_refined']]
else:
    judge_scores_final_refined = judge_scores_final_refined[['judgeId', 'judge_score_contribution_refined']]

print("\n\nFinal Refined Judge Scores (Only rounds with known order):")
print(judge_scores_final_refined.sort_values(by='judge_score_contribution_refined', ascending=False))

final_output_filename = "judge_liking_scores_final.csv"
judge_scores_final_refined.to_csv(final_output_filename, index=False)
print(f"\nFinal refined scores saved to {final_output_filename}")

# To ensure all round names are captured in `round_order`
print("\nUnique round names in Mark/Round data (for round_order map):")
print(mark_df_non_final.merge(round_df, left_on='roundId', right_on='id')['name'].unique())
print("\nUnique round names in Result data (for round_order map):")
print(result_df['section'].unique())

# The user should update the `round_order` dictionary in the script with any missing round names
# from the output above to ensure accuracy. Any round name not in the `round_order` map will currently
# lead to those marks being excluded from the "Final Refined Judge Scores".
# Example: If "Középdöntő" (another word for semifinal) appears, it should be added.
# 'Section 1', 'Section 2', etc. might also need to be mapped if they represent ordered rounds.

# --- Participant Score Calculation ---
print(f"\n--- Scoring for Participant ID: {target_participant_id} ---")

participant_data = valid_judged_rounds_df[valid_judged_rounds_df['participantId'] == target_participant_id]

if participant_data.empty:
    print(f"No valid non-final round judging data found for participant ID {target_participant_id}.")
    print("This could be because the participant had no marks in non-final rounds, or their rounds could not be mapped in 'round_order'.")
else:
    participant_score = participant_data['judge_score_contribution_refined'].sum()
    
    participant_name = ""
    if participants_df is not None:
        name_series = participants_df[participants_df['id'] == target_participant_id]['name']
        if not name_series.empty:
            participant_name = name_series.iloc[0]
    
    if participant_name:
        print(f"Score for participant {participant_name} (ID: {target_participant_id}): {participant_score}")
    else:
        print(f"Score for participant ID {target_participant_id}: {participant_score}")

    print("\nBreakdown by event for this participant (showing only events with data in non-final rounds):")
    participant_event_scores = participant_data.groupby('eventId')['judge_score_contribution_refined'].sum().reset_index()
    
    # Optional: Merge with Event.csv for event names if needed later
    # event_df = pd.read_csv('csv/Event.csv')
    # participant_event_scores = pd.merge(participant_event_scores, event_df[['id', 'name']], left_on='eventId', right_on='id', how='left')
    
    print(participant_event_scores.sort_values(by='judge_score_contribution_refined', ascending=False))


# --- Print Unique Round Names (for verification, as before) ---
print("\nUnique round names in Mark/Round data (for round_order map):")
# Ensure correct DataFrame for unique round names source before any drops or complex merges specific to advancement logic
# This should come from a point where 'round_name_judged' is clearly defined from the merge of mark_df_non_final and round_df
if 'round_name_judged' in mark_details_df.columns:
    print(mark_details_df['round_name_judged'].unique())
else:
    print("Could not determine unique round names from mark_details_df.")

print("\nUnique round names in Result data (for round_order map):")
if 'section' in result_df.columns:
    print(result_df['section'].unique())
else:
    print("Could not determine unique round names from result_df.")
