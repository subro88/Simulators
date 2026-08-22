import os
import re

WORKSPACE = r"c:\Users\user\AntigravityWorkDIR\Simulators"

html_count = 0
for root, dirs, files in os.walk(WORKSPACE):
    if ".git" in root or "node_modules" in root or "brain" in root:
        continue
    for fname in files:
        if fname.endswith(".html"):
            fpath = os.path.join(root, fname)
            with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # Replace favicon.svg with favicon.png or favicon.ico if present
            new_content = content
            new_content = re.sub(
                r'<link\s+rel="icon"\s+type="image/svg\+xml"\s+href="([^"]+)"\s*/?>',
                r'<link rel="icon" type="image/png" href="\1">',
                new_content
            )
            new_content = new_content.replace('favicon.svg', 'favicon.png')
            
            if new_content != content:
                with open(fpath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                html_count += 1

print(f"Updated favicon links in {html_count} HTML files!")
