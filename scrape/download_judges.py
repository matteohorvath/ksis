import requests
import json
import os
from concurrent.futures import ThreadPoolExecutor
from tqdm import tqdm
import time
# Create output directory if it doesn't exist
output_dir = "competition_data/results"
os.makedirs(output_dir, exist_ok=True)

# Base URL for the API
base_url = "http://localhost:3000/api/competition-results"

# ID range to scrape
start_id = 1
end_id = 12300

# Number of workers for parallel processing
num_workers = 1

def fetch_and_save(id):
    """Fetch data for a given ID and save it if not empty"""
    url = f"{base_url}?id={id}"
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            #assume its a html file and save it to the output directory
            output_file = os.path.join(output_dir, f"competition_marks_{id}.json")
            with open(output_file, 'w') as f:
                f.write(response.text)
            time.sleep(1)
            return True
        else:
            return False

        return False
    except Exception as e:
        print(f"Error fetching ID {id}: {str(e)}")
        time.sleep(1)
        #save failed id to a file
        with open("failed_ids.txt", "a") as f:
            f.write(f"{id}\n") 
        return False

def main():
    """Main function to parallelize the scraping process"""
    #read the failed ids from the file
   # with open("real_failed_ids.txt", "r") as f:
    #    failed_ids = f.readlines()
    #remove the \n from the ids
    #ids = range(start_id, end_id)
    ids = range(start_id, end_id)
    successful = 0
    
    print(f"Starting to download data for {len(ids)} IDs...")
    
    # Use ThreadPoolExecutor for parallel processing
    with ThreadPoolExecutor(max_workers=num_workers) as executor:
        # Use tqdm for progress bar
        results = list(tqdm(executor.map(fetch_and_save, ids), total=len(ids)))
    
    successful = sum(results)
    print(f"Download complete! Successfully saved {successful} non-empty responses out of {len(ids)} IDs.")

if __name__ == "__main__":
    main()
