import os
import shutil

WORKSPACE = r"c:\Users\user\AntigravityWorkDIR\Simulators"
SRC_LOGO = os.path.join(WORKSPACE, "nhit-logo.png-updated.png")

with open(SRC_LOGO, 'rb') as f:
    logo_data = f.read()

print(f"Source logo size: {len(logo_data)} bytes")

# Search for all image files in any brand folder or named *logo*
replaced_files = []
for root, dirs, files in os.walk(WORKSPACE):
    if ".git" in root or "node_modules" in root or "brain" in root or "scratch" in root:
        continue
    for fname in files:
        flower = fname.lower()
        if "logo" in flower or "favicon" in flower or "brand" in root.lower():
            if flower.endswith(('.png', '.jpg', '.jpeg', '.ico', '.svg')):
                dst = os.path.join(root, fname)
                try:
                    # Write the PNG data directly
                    with open(dst, 'wb') as out_file:
                        out_file.write(logo_data)
                    rel = os.path.relpath(dst, WORKSPACE)
                    replaced_files.append(rel)
                except Exception as e:
                    print(f"Failed to overwrite {dst}: {e}")

print(f"Directly updated {len(replaced_files)} logo/favicon/brand image files across workspace:")
for r in replaced_files:
    print(" -", r)
