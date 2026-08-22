import os
import re

ROOT_DIR = r"c:\Users\user\AntigravityWorkDIR\Simulators\nhitvisuallab"

html_count = 0
replacements_count = 0

# Regex to find %3F or %3f or %3Fv= or %3fv= in href or src attributes
pattern_encoded_q = re.compile(r'(href|src)=["\']([^"\']+)["\']', re.IGNORECASE)

for dp, dn, fn in os.walk(ROOT_DIR):
    for f in fn:
        if f.endswith('.html'):
            p = os.path.join(dp, f)
            with open(p, 'r', encoding='utf-8', errors='ignore') as fh:
                content = fh.read()
            
            new_content = content
            # Clean %3F / %3f URL encoded query parameters in HTML attributes
            if '%3F' in new_content or '%3f' in new_content:
                # Replace %3F or %3f followed by v=... up to quote or .css/.js
                # e.g., site.css%3Fv=20.css -> site.css
                # style.css%3Fv=3.css -> style.css
                # app.js%3Fv=1 -> app.js
                new_content = re.sub(r'(\.(?:css|js))%3[fF][^"\']*', r'\1', new_content)
                new_content = re.sub(r'%3[fF]', '?', new_content)
            
            if new_content != content:
                with open(p, 'w', encoding='utf-8') as fh:
                    fh.write(new_content)
                html_count += 1
                print(f"Fixed HTML URLs in: {os.path.relpath(p, ROOT_DIR)}")

print(f"\nDone! Fixed URLs in {html_count} HTML files.")
