import os
import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add import if missing
    if 'from app.core.db import get_db' not in content:
        if 'import logging' in content:
            content = content.replace('import logging', 'import logging\nfrom app.core.db import get_db')
        else:
            content = 'from app.core.db import get_db\n' + content

    lines = content.split('\n')
    new_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        
        match = re.search(r'^(\s*)async for db(_instance)? in get_db\(\):', line)
        if match:
            indent = match.group(1)
            is_instance = bool(match.group(2))
            
            # replace with db = get_db()
            new_lines.append(f"{indent}db = get_db()")
            
            i += 1
            if is_instance and i < len(lines) and 'db = db_instance' in lines[i]:
                # skip line
                i += 1
                
            # Now unindent all lines inside the block
            while i < len(lines):
                if lines[i].strip() == '':
                    new_lines.append(lines[i])
                elif lines[i].startswith(indent + '    '):
                    new_lines.append(lines[i][4:])
                elif lines[i].startswith('    ' + indent):
                    new_lines.append(lines[i][4:])
                else:
                    # block ended
                    break
                i += 1
            continue
            
        new_lines.append(line)
        i += 1

    out = '\n'.join(new_lines)
    
    # Remove the break in mapping_service.py that will cause a SyntaxError
    out = out.replace("        finally:\n            # We don't disconnect the db if it's the global instance, the session manager handles it\n            break", "        finally:\n            # We don't disconnect the db if it's the global instance, the session manager handles it\n            pass")
    out = out.replace("        finally:\n            break", "        finally:\n            pass")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(out)

fix_file("backend/app/standards/router.py")
fix_file("backend/app/standards/mapping_service.py")
print("Files fixed.")
