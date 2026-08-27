import re
from pathlib import Path

js_dir = Path("frontend/js")

for js_file in js_dir.glob("*.js"):
    text = js_file.read_text(encoding="utf-8")
    # Replace 'models/ with '/models/
    new_text = re.sub(r"(['\"])models/", r"\1/models/", text)
    if new_text != text:
        js_file.write_text(new_text, encoding="utf-8")
        print(f"Updated {js_file.name}")

print("All JS GLB paths updated to /models/!")
