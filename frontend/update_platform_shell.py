import re

file_path = "/home/anwar/Projects/Ayn/frontend/ayn-landing-page/components/platform/platform-shell.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the previous replacement with a more robust style
new_content = re.sub(
    r'className="w-52 rounded-xl p-1\.5"',
    r'className="w-52 rounded-xl bg-background/95 backdrop-blur-xl border border-border/50 shadow-xl p-1.5 z-50"',
    content
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Updated successfully")
