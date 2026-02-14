# Start Velora AI Locally (No Docker)

Write-Host "Starting Velora AI Components..." -ForegroundColor Cyan

# 1. Start Python Backend (in a new window)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd rag-core; pip install -r requirements.txt; python run_server.py"

# 2. Start Frontend (in a new window)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd rag-frontend; npm install; npm run dev"

Write-Host "Services started! Frontend should be available at http://localhost:5173" -ForegroundColor Cyan
Write-Host "Ensure you have set the UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN in your environment or .env file in rag-core." -ForegroundColor Yellow
