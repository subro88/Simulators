import sys, os
sys.path.insert(0, os.path.abspath("."))
from app.main import app

print(f"FastAPI app initialized successfully!")
print(f"Total active routes in main app: {len(app.routes)}")
