import os, re

ROOT = os.path.dirname(os.path.abspath(__file__))
count = 0
fixed = 0
for dp, dn, fn in os.walk(ROOT):
    if '.git' in dp.split(os.sep):
        continue
    for f in fn:
        if not f.endswith('.html'):
            continue
        p = os.path.join(dp, f)
        rel = os.path.relpath(p, ROOT)
        d = os.path.dirname(rel)
        levels = 0 if d in ('', '.') else d.count(os.sep) + 1
        prefix = '../' * levels
        tag = '<script src="%sshared/sidebar/sidebar.js"></script>' % prefix
        with open(p, encoding='utf-8', errors='ignore') as fh:
            s = fh.read()
        had = re.search(r'<script src="[^"]*shared/sidebar/sidebar\.js"></script>', s)
        if had:
            if had.group(0) == tag:
                continue
            s = s.replace(had.group(0), '')
            fixed += 1
        if '</body>' in s:
            s = s.replace('</body>', tag + '\n</body>', 1)
        else:
            s = s + '\n' + tag
        with open(p, 'w', encoding='utf-8') as fh:
            fh.write(s)
        count += 1
print('processed', count, 'pages, fixed prefix on', fixed)
