import os
import re

WORKSPACE = r"c:\Users\user\AntigravityWorkDIR\Simulators"

css_updated = 0

for root, dirs, files in os.walk(WORKSPACE):
    if ".git" in root or "node_modules" in root or "brain" in root:
        continue
    for fname in files:
        if fname.endswith(".css"):
            fpath = os.path.join(root, fname)
            try:
                with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                new_content = content
                
                # Replace token values in :root definitions
                new_content = re.sub(r'--bg:\s*#[0-9a-fA-F]{3,6};', '--bg:        #00212b;', new_content)
                new_content = re.sub(r'--surface:\s*#[0-9a-fA-F]{3,6};', '--surface:   #001c24;', new_content)
                new_content = re.sub(r'--surface2:\s*#[0-9a-fA-F]{3,6};', '--surface2:  #00212b;', new_content)
                
                # Replace background: #0d1117 / #161b27 / #0f1320 in body, card, container
                new_content = re.sub(r'(body\s*\{[^}]*background:\s*)#[0-9a-fA-F]{3,6}', r'\1#00212b', new_content)
                new_content = re.sub(r'(\.tool-card\s*\{[^}]*background:\s*)#[0-9a-fA-F]{3,6}', r'\1#001c24', new_content)
                new_content = re.sub(r'(\.tool-card-thumb\s*\{[^}]*background:\s*)#[0-9a-fA-F]{3,6}', r'\1#00212b', new_content)
                new_content = re.sub(r'(\.seo-about,\s*\.seo-article\s*\{[^}]*background:\s*)#[0-9a-fA-F]{3,6}', r'\1#001c24', new_content)
                
                if new_content != content:
                    with open(fpath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    css_updated += 1
            except Exception as e:
                pass

print(f"\nSuccessfully updated {css_updated} CSS files with the new #00212b / #001c24 color theme!")
