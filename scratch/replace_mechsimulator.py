import os
import re

TOOLS_DIR = r"c:\Users\user\AntigravityWorkDIR\Simulators\nhitvisuallab\tools"

count = 0
for root, dirs, files in os.walk(TOOLS_DIR):
    for fname in files:
        if fname.endswith(('.js', '.html')):
            fpath = os.path.join(root, fname)
            with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # Replace mechsimulator.com / MechSimulator with NHIT VisualLab / NHIT
            new_content = content
            new_content = re.sub(r'MechSimulator\.com', 'NHIT VisualLab', new_content, flags=re.IGNORECASE)
            new_content = re.sub(r'MECHSIMULATOR LAB', 'NHIT VISUALLAB', new_content)
            new_content = re.sub(r'MechSimulator', 'NHIT VisualLab', new_content)
            new_content = re.sub(r'mechsimulator', 'nhitvisuallab', new_content)
            
            if new_content != content:
                with open(fpath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                count += 1
                rel = os.path.relpath(fpath, TOOLS_DIR)
                print(f"Updated {rel}")

print(f"\nDone! Replaced MechSimulator branding in {count} tool files.")
