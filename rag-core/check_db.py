import os
from upstash_vector import Index
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

upstash_url = os.getenv("UPSTASH_VECTOR_REST_URL")
upstash_token = os.getenv("UPSTASH_VECTOR_REST_TOKEN")

if not upstash_url or not upstash_token:
    print("Error: Upstash credentials not found in .env")
    exit(1)

print(f"Connecting to Upstash: {upstash_url}")

try:
    index = Index(url=upstash_url, token=upstash_token)
    
    # Check stats
    stats = index.info()
    print(f"Index Stats: {stats}")
    print(f"Vector Count: {stats.vector_count}")
    
    if stats.vector_count > 0:
        print("WARNING: Vectors still exist!")
    else:
        print("Success: Index is empty.")
    
except Exception as e:
    print(f"Failed to check database: {e}")
