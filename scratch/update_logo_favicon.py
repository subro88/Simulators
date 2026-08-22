import os
import shutil

WORKSPACE = r"c:\Users\user\AntigravityWorkDIR\Simulators"
SRC_LOGO = os.path.join(WORKSPACE, "nhit-logo.png-updated.png")

if not os.path.exists(SRC_LOGO):
    print("ERROR: Source logo file not found at", SRC_LOGO)
    exit(1)

# Destination paths for logos and favicons across nhitvisuallab & frontend
TARGETS = [
    # Brand logo targets
    os.path.join(WORKSPACE, "nhitvisuallab", "brand", "biglogo.png"),
    os.path.join(WORKSPACE, "nhitvisuallab", "brand", "Modern_logo.png"),
    os.path.join(WORKSPACE, "nhitvisuallab", "brand", "no_background_logo.png"),
    os.path.join(WORKSPACE, "nhitvisuallab", "brand", "logo.png"),
    os.path.join(WORKSPACE, "frontend", "brand", "logo.png"),
    os.path.join(WORKSPACE, "frontend", "logo.png"),
    # Favicon targets
    os.path.join(WORKSPACE, "nhitvisuallab", "favicon.png"),
    os.path.join(WORKSPACE, "nhitvisuallab", "favicon.ico"),
    os.path.join(WORKSPACE, "nhitvisuallab", "apple-touch-icon.png"),
    os.path.join(WORKSPACE, "frontend", "favicon.png"),
    os.path.join(WORKSPACE, "frontend", "favicon.ico"),
    os.path.join(WORKSPACE, "favicon.ico"),
]

for dst in TARGETS:
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copy2(SRC_LOGO, dst)
    print("Copied updated logo to:", os.path.relpath(dst, WORKSPACE))

print("\nLogo & Favicon files successfully updated across all brand locations!")
