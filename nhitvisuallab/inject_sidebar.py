import os, re

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_PROJECT_DIR = os.path.abspath(os.path.join(ROOT_DIR, ".."))

count = 0
fixed = 0

target_dirs = [
    ROOT_DIR,
    os.path.join(BASE_PROJECT_DIR, "frontend")
]

for target in target_dirs:
    if not os.path.exists(target):
        continue
    for dp, dn, fn in os.walk(target):
        if '.git' in dp.split(os.sep) or 'node_modules' in dp.split(os.sep):
            continue
        for f in fn:
            if not f.endswith('.html'):
                continue
            p = os.path.join(dp, f)
            
            # Determine path to nhitvisuallab/shared/sidebar/sidebar.js
            rel_to_nhit = os.path.relpath(p, ROOT_DIR)
            if rel_to_nhit.startswith('..'):
                # In frontend directory
                tag = '<script src="/nhitvisuallab/shared/sidebar/sidebar.js"></script>'
            else:
                d = os.path.dirname(rel_to_nhit)
                levels = 0 if d in ('', '.') else d.count(os.sep) + 1
                prefix = '../' * levels
                tag = '<script src="%sshared/sidebar/sidebar.js"></script>' % prefix

            with open(p, encoding='utf-8', errors='ignore') as fh:
                s = fh.read()
            
            had = re.search(r'<script src="[^"]*shared/sidebar/sidebar\.js"></script>', s)
            if had:
                if had.group(0) == tag:
                    continue
                s = s.replace(had.group(0), tag)
                fixed += 1
            else:
                if '</body>' in s:
                    s = s.replace('</body>', tag + '\n</body>', 1)
                else:
                    s = s + '\n' + tag
                fixed += 1

            with open(p, 'w', encoding='utf-8') as fh:
                fh.write(s)
            count += 1

print(f"Processed {count} HTML pages across nhitvisuallab and frontend, updated {fixed} pages.")
