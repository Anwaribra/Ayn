import re

file_path = "/home/anwar/Projects/Ayn/frontend/ayn-landing-page/components/landing/LandingNavbar.tsx"

with open(file_path, "r") as f:
    content = f.read()

# Remove icons from navItems
content = re.sub(r', icon: \w+', '', content)

# Remove the eye icon HTML block
eye_icon_pattern = re.compile(
    r'\{/\* Minimal abstract eye/A icon \*/\}.*?<div className="w-2\.5 h-2\.5 rounded-sm bg-current rotate-45" />\s*</div>\s*',
    re.DOTALL
)
content = eye_icon_pattern.sub('', content)

# Remove the {Icon && ...} from the nav links rendering
icon_render_pattern = re.compile(
    r'\{Icon && <Icon className="w-3\.5 h-3\.5" />\}\s*',
    re.DOTALL
)
content = icon_render_pattern.sub('', content)

# Change map signature from { label, href, icon: Icon } to { label, href }
content = content.replace('{ navItems.map(({ label, href, icon: Icon }) => (', '{ navItems.map(({ label, href }) => (')

# Enhance glassmorphism
# Old outer div:
# "pointer-events-auto flex items-center justify-between gap-4 p-1.5 pl-4 pr-1.5 rounded-full transition-all duration-500 shadow-2xl backdrop-blur-xl border max-w-5xl w-full"
# Old bg logic:
# isOverDark ? "bg-[#0A0A0A]/80 border-white/10" : "bg-white/80 border-black/10"

# We will replace these specific lines.
content = content.replace(
    '"pointer-events-auto flex items-center justify-between gap-4 p-1.5 pl-4 pr-1.5 rounded-full transition-all duration-500 shadow-2xl backdrop-blur-xl border max-w-5xl w-full"',
    '"pointer-events-auto flex items-center justify-between gap-4 p-1.5 pl-4 pr-1.5 rounded-full transition-all duration-500 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-2xl border max-w-5xl w-full"'
)

content = content.replace(
    'isOverDark\n              ? "bg-[#0A0A0A]/80 border-white/10"\n              : "bg-white/80 border-black/10"',
    'isOverDark\n              ? "bg-[#0A0A0A]/40 border-white/10"\n              : "bg-white/40 border-black/10"'
)

# And for the inner nav pill:
content = content.replace(
    'isOverDark\n                ? "bg-white/5 border border-white/5"\n                : "bg-black/5 border border-black/5"',
    'isOverDark\n                ? "bg-white/10 border border-white/10"\n                : "bg-black/5 border border-black/10"'
)

with open(file_path, "w") as f:
    f.write(content)

print("Navbar styles updated!")
