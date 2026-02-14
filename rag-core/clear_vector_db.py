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
    
    # Reset the index (deletes all vectors)
    print("Resetting index (deleting all vectors)...")
    index.reset()
    
    print("Successfully cleared all content from Vector Database.")
    
except Exception as e:
    print(f"Failed to clear database: {e}")
