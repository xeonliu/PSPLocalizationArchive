import os
import sys
import yaml
import glob

def load_yaml(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
        return None

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(script_dir)
    entities_dir = os.path.join(root_dir, 'entities')
    games_dir = os.path.join(root_dir, 'content', 'games')

    valid_group_ids = set()
    for f in glob.glob(os.path.join(entities_dir, 'groups', '*.yml')):
        data = load_yaml(f)
        if data and 'id' in data:
            valid_group_ids.add(data['id'])
        else:
            basename = os.path.splitext(os.path.basename(f))[0]
            valid_group_ids.add(basename) # Fallback to filename

    valid_staff_ids = set()
    for f in glob.glob(os.path.join(entities_dir, 'staff', '*.yml')):
        data = load_yaml(f)
        if data and 'id' in data:
            valid_staff_ids.add(data['id'])
        else:
            basename = os.path.splitext(os.path.basename(f))[0]
            if '_' in basename:
                valid_staff_ids.add(basename.split('_')[0])
            else:
                valid_staff_ids.add(basename)

    errors = []

    for game_path in glob.glob(os.path.join(games_dir, '*')):
        if not os.path.isdir(game_path):
            continue

        game_id = os.path.basename(game_path)
        releases_dir = os.path.join(game_path, 'releases')
        localizations_dir = os.path.join(game_path, 'localizations')

        valid_releases = set()
        if os.path.exists(releases_dir):
            for f in glob.glob(os.path.join(releases_dir, '*.yml')):
                valid_releases.add(os.path.splitext(os.path.basename(f))[0])

        if os.path.exists(localizations_dir):
            for loc_file in glob.glob(os.path.join(localizations_dir, '*.yml')):
                if loc_file.endswith('_files.yml'):
                    continue

                data = load_yaml(loc_file)
                if not data:
                    continue

                rel_path = os.path.relpath(loc_file, root_dir).replace('\\', '/')
                
                # 1. Check group_id
                group_id = data.get('group_id')
                if group_id and group_id not in valid_group_ids:
                    errors.append(f"{rel_path}: Invalid group_id '{group_id}'")

                # 2. Check staff.id
                staff = data.get('staff', [])
                if staff:
                    for s in staff:
                        s_id = s.get('id')
                        if s_id and s_id not in valid_staff_ids:
                            errors.append(f"{rel_path}: Invalid staff.id '{s_id}'")

                # 3. Check target_release
                target_releases = data.get('target_release', [])
                if isinstance(target_releases, str):
                    target_releases = [target_releases]
                
                if target_releases:
                    for tr in target_releases:
                        if tr not in valid_releases:
                            errors.append(f"{rel_path}: Invalid target_release '{tr}' (not found in {game_id}/releases/)")

    if errors:
        print(f"Validation failed with {len(errors)} errors:")
        for e in errors:
            print(f" - {e}")
        sys.exit(1)
    else:
        print("Validation passed. All references are valid.")

if __name__ == "__main__":
    main()
