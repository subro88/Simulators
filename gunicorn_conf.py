# Production Gunicorn Configuration for NHIT Visual Lab (vlab.nhit.in)
import multiprocessing
import os

bind = os.getenv("BIND", "0.0.0.0:8080")
workers = int(os.getenv("WEB_CONCURRENCY", multiprocessing.cpu_count() * 2 + 1))
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
timeout = 120
keepalive = 5
max_requests = 2000
max_requests_jitter = 400
loglevel = os.getenv("LOG_LEVEL", "info")
accesslog = "-"
errorlog = "-"
capture_output = True
enable_stdio_inheritance = True
