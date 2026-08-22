import os
import re
import urllib.request

TOOLS_DIR = r"c:\Users\user\AntigravityWorkDIR\Simulators\nhitvisuallab\tools"
BASE_URL = "https://mechsimulator.com/tools"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

downloaded_total = 0

for tool in os.listdir(TOOLS_DIR):
    tool_path = os.path.join(TOOLS_DIR, tool)
    if not os.path.isdir(tool_path):
        continue
    
    app_js = os.path.join(tool_path, "app.js")
    if not os.path.exists(app_js):
        continue
    
    with open(app_js, 'r', encoding='utf-8', errors='ignore') as f:
        code = f.read()
    
    # Find all asset references like 'assets/xyz.png' or 'assets/xyz.jpg' or 'assets/xyz.svg'
    matches = set(re.findall(r'assets/([a-zA-Z0-9_\-\.]+\.(?:png|jpg|jpeg|svg|webp))', code))
    if not matches:
        continue
    
    assets_dir = os.path.join(tool_path, "assets")
    os.makedirs(assets_dir, exist_ok=True)
    
    for filename in matches:
        dest = os.path.join(assets_dir, filename)
        if not os.path.exists(dest):
            url = f"{BASE_URL}/{tool}/assets/{filename}"
            try:
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req) as resp, open(dest, 'wb') as out_file:
                    data = resp.read()
                    out_file.write(data)
                    downloaded_total += 1
                    print(f"[{tool}] Downloaded {filename} ({len(data)} bytes)")
            except Exception as e:
                pass

print(f"\nDone! Downloaded {downloaded_total} missing assets across all tools.")
