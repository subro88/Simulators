import os

ROOT_DIR = r"c:\Users\user\AntigravityWorkDIR\Simulators\nhitvisuallab"

renamed_count = 0

for dp, dn, fn in os.walk(ROOT_DIR):
    for f in fn:
        if '?' in f or '\uf03f' in f or '%3F' in f or '%3f' in f or 'v=' in f:
            old_path = os.path.join(dp, f)
            clean_name = f
            for char in ['?', '\uf03f', '%3F', '%3f']:
                if char in clean_name:
                    clean_name = clean_name.split(char)[0]
            
            if 'v=' in clean_name and (clean_name.endswith('.css') or clean_name.endswith('.js')):
                # handles any remaining query artifacts
                pass

            new_path = os.path.join(dp, clean_name)
            
            if old_path != new_path:
                try:
                    if os.path.exists(new_path):
                        os.remove(old_path)
                        print(f"Removed redundant query file: {clean_name}")
                    else:
                        os.rename(old_path, new_path)
                        print(f"Renamed file -> {clean_name}")
                    renamed_count += 1
                except Exception as e:
                    print(f"Error handling file: {e}")

print(f"\nDone! Processed {renamed_count} files.")
