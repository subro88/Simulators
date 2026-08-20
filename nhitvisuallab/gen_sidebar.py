import os, re, html, json

ROOT = os.path.dirname(os.path.abspath(__file__))

# category pages, in display order
CATS = ['testing', 'measuring', 'mechanics', 'mechanisms', 'strength',
        'thermal', 'electrical', 'workshop', 'calculators',
        'basic-science', 'maths']


def get_h1(path):
    try:
        s = open(path, encoding='utf-8', errors='ignore').read()
    except Exception:
        return ''
    m = re.search(r'<h1[^>]*>(.*?)</h1>', s, re.S)
    if m:
        return html.unescape(re.sub(r'<[^>]+>', '', m.group(1))).strip()
    mt = re.search(r'<title[^>]*>(.*?)</title>', s, re.S)
    if mt:
        return html.unescape(mt.group(1).split('|')[0].split('—')[0]).strip()
    return ''


def tool_title(slug):
    p = os.path.join(ROOT, 'tools', slug, 'index.html')
    if os.path.exists(p):
        t = get_h1(p)
        if t:
            return t
    return ''


def parse_cat(cdir):
    cp = os.path.join(ROOT, cdir, 'index.html')
    if not os.path.exists(cp):
        return None
    name = get_h1(cp) or cdir
    cs = open(cp, encoding='utf-8', errors='ignore').read()
    tools = []
    seen = set()
    tdir = os.path.join(ROOT, 'tools')
    for m in re.finditer(
            r'<a\s+[^>]*href="\.\./tools/([^"/]+)/index\.html"[^>]*>(.*?)</a>',
            cs, re.S):
        slug = m.group(1)
        txt = html.unescape(re.sub(r'<[^>]+>', '', m.group(2))).strip()
        if slug in seen:
            continue
        if not os.path.isdir(os.path.join(tdir, slug)):
            continue
        seen.add(slug)
        tools.append({'slug': slug, 'title': tool_title(slug) or txt})
    return name, tools


data = []
covered = set()
for c in CATS:
    r = parse_cat(c)
    if not r:
        continue
    name, tools = r
    if tools:
        data.append({'name': name, 'tools': tools})
        covered.update(t['slug'] for t in tools)

# catch any tools not listed on a category page
all_tools = sorted(d for d in os.listdir(os.path.join(ROOT, 'tools'))
                   if os.path.isdir(os.path.join(ROOT, 'tools', d)))
uncovered = [s for s in all_tools if s not in covered]
if uncovered:
    extra = [{'slug': s, 'title': tool_title(s) or s} for s in uncovered]
    data.append({'name': 'Other Simulations', 'tools': extra})

TEMPLATE = r"""// NHIT VisualLab — overlay sidebar with categorised simulations.
// Self-contained: injects its own CSS and builds the DOM from SIDEBAR_DATA.
(function () {
  var SIDEBAR_DATA = __DATA__;

  // Link prefix relative to site root, derived from current page depth.
  function rootPrefix() {
    var segs = location.pathname.split('/').filter(Boolean);
    var dirDepth = Math.max(0, segs.length - 1);
    var p = '';
    for (var i = 0; i < dirDepth; i++) p += '../';
    return p;
  }
  var ROOT = rootPrefix();

  var css =
    '#sim-sidebar{position:fixed;top:0;left:0;height:100vh;width:300px;max-width:85vw;' +
    'background:#0f1320;color:#dce3f0;box-shadow:2px 0 18px rgba(0,0,0,.5);' +
    'transform:translateX(-100%);transition:transform .25s ease;z-index:9999;' +
    'display:flex;flex-direction:column;font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;font-size:14px}' +
    'body.sim-sidebar-open #sim-sidebar{transform:translateX(0)}' +
    '#sim-sidebar .sb-head{padding:14px 14px 10px;border-bottom:1px solid #1e2740;' +
    'position:sticky;top:0;background:#0f1320;z-index:2}' +
    '#sim-sidebar .sb-brand{font-weight:800;font-size:15px;color:#7aa2ff;letter-spacing:.3px}' +
    '#sim-sidebar .sb-sub{font-size:11px;color:#6b7a99;margin-top:2px}' +
    '#sim-sidebar .sb-search{margin-top:10px;width:100%;box-sizing:border-box;padding:8px 10px;' +
    'border-radius:8px;border:1px solid #1e2740;background:#0a0d18;color:#dce3f0;outline:none}' +
    '#sim-sidebar .sb-search:focus{border-color:#7aa2ff}' +
    '#sim-sidebar .sb-body{overflow-y:auto;padding:8px 6px 24px;flex:1}' +
    '#sim-sidebar details{border-bottom:1px solid #161d33}' +
    '#sim-sidebar summary{cursor:pointer;padding:9px 10px;font-weight:700;color:#cdd7ee;' +
    'list-style:none;display:flex;justify-content:space-between;align-items:center}' +
    '#sim-sidebar summary::-webkit-details-marker{display:none}' +
    '#sim-sidebar summary .sb-count{font-size:11px;color:#6b7a99;font-weight:600}' +
    '#sim-sidebar summary:hover{background:#141b30}' +
    '#sim-sidebar .sb-list{margin:0;padding:0 0 6px}' +
    '#sim-sidebar .sb-list a{display:block;padding:6px 12px 6px 22px;color:#aab6d4;' +
    'text-decoration:none;border-radius:6px;margin:1px 6px}' +
    '#sim-sidebar .sb-list a:hover{background:#1b2540;color:#fff}' +
    '#sim-sidebar .sb-hint{font-size:10px;color:#56627f;padding:8px 12px}' +
    '#sim-sidebar-toggle{position:fixed;top:12px;left:12px;z-index:10001;width:40px;height:40px;' +
    'border:none;border-radius:10px;background:#0f1320;color:#7aa2ff;font-size:18px;' +
    'cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.4);display:flex;align-items:center;' +
    'justify-content:center}' +
    'body.sim-sidebar-open #sim-sidebar-toggle{left:312px}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var sidebar = document.createElement('aside');
  sidebar.id = 'sim-sidebar';

  var head = document.createElement('div');
  head.className = 'sb-head';
  var brand = document.createElement('div');
  brand.className = 'sb-brand';
  brand.textContent = 'NHIT VisualLab';
  var sub = document.createElement('div');
  sub.className = 'sb-sub';
  sub.textContent = 'All Simulations';
  head.appendChild(brand);
  head.appendChild(sub);
  var search = document.createElement('input');
  search.className = 'sb-search';
  search.placeholder = 'Search simulations…';
  search.setAttribute('aria-label', 'Search simulations');
  head.appendChild(search);
  sidebar.appendChild(head);

  var bodyEl = document.createElement('div');
  bodyEl.className = 'sb-body';

  SIDEBAR_DATA.forEach(function (cat) {
    var det = document.createElement('details');
    det.open = true;
    var sum = document.createElement('summary');
    var sname = document.createElement('span');
    sname.textContent = cat.name;
    var cnt = document.createElement('span');
    cnt.className = 'sb-count';
    cnt.textContent = cat.tools.length;
    sum.appendChild(sname);
    sum.appendChild(cnt);
    det.appendChild(sum);
    var ul = document.createElement('div');
    ul.className = 'sb-list';
    cat.tools.forEach(function (t) {
      var a = document.createElement('a');
      a.textContent = t.title;
      a.href = ROOT + 'tools/' + t.slug + '/index.html';
      ul.appendChild(a);
    });
    det.appendChild(ul);
    bodyEl.appendChild(det);
  });

  var hint = document.createElement('div');
  hint.className = 'sb-hint';
  hint.textContent = '← hide · → show · Esc closes';
  bodyEl.appendChild(hint);
  sidebar.appendChild(bodyEl);
  document.body.appendChild(sidebar);

  var btn = document.createElement('button');
  btn.id = 'sim-sidebar-toggle';
  btn.title = 'Toggle simulations sidebar (← / →)';
  btn.innerHTML = '&#9776;';
  document.body.appendChild(btn);

  function openSb() {
    document.body.classList.add('sim-sidebar-open');
    clearTimeout(autoHideTimer);
  }
  function closeSb() {
    document.body.classList.remove('sim-sidebar-open');
  }
  function toggleSb() {
    if (document.body.classList.contains('sim-sidebar-open')) closeSb();
    else openSb();
  }

  var autoHideTimer;
  sidebar.addEventListener('mouseleave', function () {
    autoHideTimer = setTimeout(closeSb, 700);
  });
  sidebar.addEventListener('mouseenter', function () {
    clearTimeout(autoHideTimer);
  });

  btn.addEventListener('click', toggleSb);

  document.addEventListener('keydown', function (e) {
    var t = e.target;
    var typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' ||
      t.tagName === 'SELECT' || t.isContentEditable);
    if (typing) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); openSb(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); closeSb(); }
    else if (e.key === 'Escape') { closeSb(); }
  });

  document.addEventListener('click', function (e) {
    if (document.body.classList.contains('sim-sidebar-open') &&
        !sidebar.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
      closeSb();
    }
  });

  sidebar.addEventListener('click', function (e) {
    if (e.target.closest('a')) setTimeout(closeSb, 60);
  });

  // Open on load as an overlay, then auto-hide unless the user engages it.
  openSb();
  setTimeout(function () {
    if (!sidebar.matches(':hover')) closeSb();
  }, 5000);

  search.addEventListener('input', function () {
    var q = search.value.trim().toLowerCase();
    var groups = sidebar.querySelectorAll('details');
    groups.forEach(function (det) {
      var any = false;
      det.querySelectorAll('a').forEach(function (a) {
        var match = a.textContent.toLowerCase().indexOf(q) !== -1;
        a.style.display = match ? '' : 'none';
        if (match) any = true;
      });
      if (q.length > 0) {
        det.style.display = any ? '' : 'none';
        det.open = any;
      } else {
        det.style.display = '';
        det.open = true;
      }
    });
  });
})();
"""

js = TEMPLATE.replace('__DATA__', json.dumps(data, ensure_ascii=False))
out = os.path.join(ROOT, 'shared', 'sidebar', 'sidebar.js')
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w', encoding='utf-8') as f:
    f.write(js)

print('categories:', len(data))
print('total tools in sidebar:', sum(len(d['tools']) for d in data))
