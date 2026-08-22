import os
import re

ROOT_DIR = r"c:\Users\user\AntigravityWorkDIR\Simulators"

html_files = []
for dp, dn, fn in os.walk(ROOT_DIR):
    if '.git' in dp.split(os.sep) or 'node_modules' in dp.split(os.sep) or '.pytest_cache' in dp.split(os.sep):
        continue
    for f in fn:
        if f.endswith('.html'):
            html_files.append(os.path.join(dp, f))

total_removed = 0
files_modified = 0

# Pattern for empty ad-cards / empty tool-cards
# e.g., <div class="tool-card ad-card" aria-label="Sponsored ad">\s*</div>
# or <div class="ad-card"[^>]*>\s*</div>
pattern_ad_card = re.compile(r'<div\s+class="[^"]*ad-card[^"]*"[^>]*>\s*</div>\s*', re.MULTILINE | re.DOTALL)
pattern_empty_tool_card = re.compile(r'<div\s+class="tool-card"[^>]*>\s*</div>\s*', re.MULTILINE | re.DOTALL)

for p in html_files:
    with open(p, 'r', encoding='utf-8', errors='ignore') as fh:
        content = fh.read()
    
    new_content, count1 = pattern_ad_card.subn('', content)
    new_content, count2 = pattern_empty_tool_card.subn('', new_content)
    
    count_total = count1 + count2
    if count_total > 0:
        with open(p, 'w', encoding='utf-8') as fh:
            fh.write(new_content)
        files_modified += 1
        total_removed += count_total
        print(f"Cleaned {count_total} empty ad/tool cards from {os.path.relpath(p, ROOT_DIR)}")

print(f"\nDone! Removed {total_removed} empty cards across {files_modified} HTML files.")
