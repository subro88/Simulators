import os
import urllib.request

ASSETS_DIR = r"c:\Users\user\AntigravityWorkDIR\Simulators\nhitvisuallab\tools\vernier-caliper\assets"
os.makedirs(ASSETS_DIR, exist_ok=True)

BASE_URL = "https://mechsimulator.com/tools/vernier-caliper/assets/"
FILES = ["vernier1.png", "vernier2.png", "vernier3.png", "vernier_base.png", "blade.png"]

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

for filename in FILES:
    url = BASE_URL + filename
    dest = os.path.join(ASSETS_DIR, filename)
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as resp, open(dest, 'wb') as out_file:
            data = resp.read()
            out_file.write(data)
            print(f"Downloaded {filename}: {len(data)} bytes")
    except Exception as e:
        print(f"Failed to download {filename}: {e}")

print("Assets sync completed!")
