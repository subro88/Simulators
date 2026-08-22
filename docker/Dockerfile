FROM python:3.11-slim

WORKDIR /workspace

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source & assets
COPY app/ ./app/
COPY blender/ ./blender/
COPY frontend/ ./frontend/
COPY nhitvisuallab/ ./nhitvisuallab/

# Generate 3D models during build
RUN python blender/generate_glb.py || true

# Expose unified simulation port
EXPOSE 8080

# Run FastAPI server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
