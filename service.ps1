# Go to service folder
cd ml_service

# Activate venv
.\venv\Scripts\Activate

# Run your server
uvicorn main:app --port 5000
