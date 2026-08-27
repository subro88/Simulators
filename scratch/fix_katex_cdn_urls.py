import re
from pathlib import Path

nhit_dir = Path("nhitvisuallab")
frontend_dir = Path("frontend")

modified_count = 0

def fix_html_file(fpath):
    global modified_count
    content = fpath.read_text(encoding="utf-8")
    # Replace any ../../cdn.jsdelivr.net or ../cdn.jsdelivr.net with https://cdn.jsdelivr.net
    new_content = re.sub(r'(\.\./)+cdn\.jsdelivr\.net', 'https://cdn.jsdelivr.net', content)
    if new_content != content:
        fpath.write_text(new_content, encoding="utf-8")
        modified_count += 1
        print(f"Fixed KaTeX CDN links in {fpath}")

for f in nhit_dir.rglob("*.html"):
    fix_html_file(f)

for f in frontend_dir.rglob("*.html"):
    fix_html_file(f)

print(f"Total HTML files fixed: {modified_count}")
