import sys
import os
sys.path.insert(0, os.getcwd())
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("--- Testing Routes ---")
# 1. Test original legacy two-stroke-engine page
res_v1_two_stroke = client.get("/nhitvisuallab/tools/two-stroke-engine/index.html")
print("GET /nhitvisuallab/tools/two-stroke-engine/index.html -> status:", res_v1_two_stroke.status_code)
assert res_v1_two_stroke.status_code == 200
assert "Two Stroke Engine &mdash; Petrol Cycle Simulator" in res_v1_two_stroke.text

# 2. Test V2 two_stroke.html page
res_v2_two_stroke = client.get("/two_stroke.html")
print("GET /two_stroke.html -> status:", res_v2_two_stroke.status_code)
assert res_v2_two_stroke.status_code == 200
assert "Two-Stroke Internal Combustion Engine" in res_v2_two_stroke.text

# 3. Test Home Page
res_home = client.get("/")
print("GET / -> status:", res_home.status_code)
assert res_home.status_code == 200

print("ALL PREVIOUS AND V2 ROUTE CHECKS PASSED PERFECTLY!")
