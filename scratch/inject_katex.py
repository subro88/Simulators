from pathlib import Path

katex_block = """  <!-- KaTeX CSS & JS for rendering LaTeX math formulas -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" />
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js" onload="renderMathInElement(document.body, {delimiters: [{left: '$$', right: '$$', display: true}, {left: '\\\\[', right: '\\\\]', display: true}, {left: '\\\\(', right: '\\\\)', display: false}, {left: '$', right: '$', display: false}]});"></script>
"""

frontend_dir = Path("frontend")

v2_html_files = [
    "differential.html", "clutch.html", "steering.html", "two_stroke.html",
    "four_stroke.html", "valve_timing.html", "four_bar.html", "cam_follower.html",
    "gear_trains.html", "slider_crank.html", "ohms_law.html", "stress_strain.html",
    "bernoullis_principle.html", "lathe_turning.html"
]

updated_count = 0
for fname in v2_html_files:
    fpath = frontend_dir / fname
    if not fpath.exists():
        continue
    content = fpath.read_text(encoding="utf-8")
    if "katex.min.css" not in content:
        # Inject before </head>
        new_content = content.replace("</head>", katex_block + "</head>")
        fpath.write_text(new_content, encoding="utf-8")
        updated_count += 1
        print(f"Injected KaTeX into {fname}")

print(f"Total HTML files updated with KaTeX: {updated_count}")
