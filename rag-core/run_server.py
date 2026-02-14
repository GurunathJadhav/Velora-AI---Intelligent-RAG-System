import sys
import asyncio
import os

# FORCE Windows Proactor Event Loop Policy for Playwright compatibility
# This must run before any asyncio loop is created
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

import uvicorn

if __name__ == "__main__":
    # Run Uvicorn via Python script to ensure the Event Loop Policy is active
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
