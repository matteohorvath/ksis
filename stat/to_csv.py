import sqlite3
import csv
import os

# Define the database file and the output directory
db_file = 'dev.db'
output_dir = 'csv'

# Create the output directory if it doesn't exist
os.makedirs(output_dir, exist_ok=True)

# Connect to the SQLite database
conn = sqlite3.connect(db_file)
cursor = conn.cursor()

# Get a list of all tables in the database
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

# Loop through each table
for table_name_tuple in tables:
    table_name = table_name_tuple[0]
    print(f"Processing table: {table_name}")

    # Query all data from the table
    cursor.execute(f"SELECT * FROM {table_name}")
    rows = cursor.fetchall()

    # Get column headers
    column_headers = [description[0] for description in cursor.description]

    # Define the CSV file path
    csv_file_path = os.path.join(output_dir, f"{table_name}.csv")

    # Write the data to a CSV file
    with open(csv_file_path, 'w', newline='') as csv_file:
        csv_writer = csv.writer(csv_file)
        csv_writer.writerow(column_headers)  # Write headers
        csv_writer.writerows(rows)          # Write data rows

    print(f"Table {table_name} successfully written to {csv_file_path}")

# Close the database connection
conn.close()

print("All tables have been converted to CSV files.")
