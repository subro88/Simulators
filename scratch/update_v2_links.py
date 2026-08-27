import os
from pathlib import Path

nhit_dir = Path("nhitvisuallab")

replacements = [
    ('href="../tools/differential-gear/index.html"', 'href="/differential.html"'),
    ('href="../tools/clutch-simulator/index.html"', 'href="/clutch.html"'),
    ('href="../tools/steering-geometry/index.html"', 'href="/steering.html"'),
    ('href="../tools/two-stroke-engine/index.html"', 'href="/two_stroke.html"'),
    ('href="../tools/four-stroke-engine/index.html"', 'href="/four_stroke.html"'),
    ('href="../tools/valve-timing-diagram/index.html"', 'href="/valve_timing.html"'),
    ('href="../tools/four-bar-linkage/index.html"', 'href="/four_bar.html"'),
    ('href="../tools/cam-follower/index.html"', 'href="/cam_follower.html"'),
    ('href="../tools/gear-trains/index.html"', 'href="/gear_trains.html"'),
    ('href="../tools/slider-crank/index.html"', 'href="/slider_crank.html"'),
    ('href="../tools/ohms-law/index.html"', 'href="/ohms_law.html"'),
    ('href="../tools/stress-strain/index.html"', 'href="/stress_strain.html"'),
    ('href="../tools/bernoulli-principle/index.html"', 'href="/bernoullis_principle.html"'),
    ('href="../tools/bernoullis-principle/index.html"', 'href="/bernoullis_principle.html"'),
    ('href="../tools/lathe-machine/index.html"', 'href="/lathe_turning.html"'),
    ('href="../tools/lathe-turning/index.html"', 'href="/lathe_turning.html"'),
    # Root level relative links in nhitvisuallab/index.html
    ('href="tools/differential-gear/index.html"', 'href="/differential.html"'),
    ('href="tools/clutch-simulator/index.html"', 'href="/clutch.html"'),
    ('href="tools/steering-geometry/index.html"', 'href="/steering.html"'),
    ('href="tools/two-stroke-engine/index.html"', 'href="/two_stroke.html"'),
    ('href="tools/four-stroke-engine/index.html"', 'href="/four_stroke.html"'),
    ('href="tools/valve-timing-diagram/index.html"', 'href="/valve_timing.html"'),
    ('href="tools/four-bar-linkage/index.html"', 'href="/four_bar.html"'),
    ('href="tools/cam-follower/index.html"', 'href="/cam_follower.html"'),
    ('href="tools/gear-trains/index.html"', 'href="/gear_trains.html"'),
    ('href="tools/slider-crank/index.html"', 'href="/slider_crank.html"'),
    ('href="tools/ohms-law/index.html"', 'href="/ohms_law.html"'),
    ('href="tools/stress-strain/index.html"', 'href="/stress_strain.html"'),
    ('href="tools/bernoulli-principle/index.html"', 'href="/bernoullis_principle.html"'),
    ('href="tools/bernoullis-principle/index.html"', 'href="/bernoullis_principle.html"'),
    ('href="tools/lathe-machine/index.html"', 'href="/lathe_turning.html"'),
    ('href="tools/lathe-turning/index.html"', 'href="/lathe_turning.html"'),
]

modified_count = 0
for html_file in nhit_dir.rglob("*.html"):
    content = html_file.read_text(encoding="utf-8")
    new_content = content
    for old, new in replacements:
        new_content = new_content.replace(old, new)
    if new_content != content:
        html_file.write_text(new_content, encoding="utf-8")
        modified_count += 1
        print(f"Updated {html_file}")

# Sync frontend/index.html with updated nhitvisuallab/index.html
import shutil
shutil.copyfile("nhitvisuallab/index.html", "frontend/index.html")
print(f"Total HTML files updated: {modified_count}. Copied to frontend/index.html")
