from pathlib import Path
import sys
root = Path('.').resolve()
exclude_dirs = {'node_modules', '.next', '.git'}
extensions = {'.ts','.tsx','.js','.jsx','.md','.json','.css'}
problems = []
for path in root.rglob('*'):
    if not path.is_file():
        continue
    if any(part in exclude_dirs for part in path.parts):
        continue
    if path.suffix.lower() not in extensions:
        continue
    data = path.read_bytes()
    try:
        data.decode('utf-8')
        continue
    except UnicodeDecodeError as e:
        # try common Windows encoding
        try_encodings = ['cp1252', 'latin_1']
        fixed = None
        for enc in try_encodings:
            try:
                text = data.decode(enc)
                fixed = text
                used_enc = enc
                break
            except Exception:
                continue
        if fixed is None:
            problems.append((str(path), 'unknown'))
            print('UNABLE TO FIX:', path)
            continue
        # backup original
        bak = path.with_suffix(path.suffix + '.bak')
        if not bak.exists():
            path.rename(bak)
            path.write_text(fixed, encoding='utf-8')
            print('Converted', path, 'from', used_enc, '-> utf-8 (backup at', bak, ')')
            problems.append((str(path), used_enc))
        else:
            print('Backup exists, skipping conversion for', path)
            problems.append((str(path), used_enc))

print('Done. Problems/fixes:', len(problems))
for p in problems:
    print(p)
