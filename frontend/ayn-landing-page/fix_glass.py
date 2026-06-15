import re

file_path = "/home/anwar/Projects/Ayn/frontend/ayn-landing-page/components/landing/LandingNavbar.tsx"

with open(file_path, "r") as f:
    content = f.read()

# Replace outer navbar classes
content = content.replace(
    'isOverDark\n              ? "bg-[#0A0A0A]/50 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl"\n              : "bg-white/60 border border-black/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-xl"',
    'isOverDark\n              ? "bg-white/[0.02] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-md"\n              : "bg-black/[0.02] border border-black/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md"'
)

# Replace inner navbar classes (make them transparent to unify the glass)
content = content.replace(
    'isOverDark\n                  ? "bg-white/[0.03] border border-white/[0.05]"\n                  : "bg-black/[0.03] border border-black/[0.04]"',
    '""'
)

with open(file_path, "w") as f:
    f.write(content)

print("Glassmorphism fixed!")
