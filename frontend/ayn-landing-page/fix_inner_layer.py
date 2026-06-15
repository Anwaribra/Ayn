import re

file_path = "/home/anwar/Projects/Ayn/frontend/ayn-landing-page/components/landing/LandingNavbar.tsx"

with open(file_path, "r") as f:
    content = f.read()

old_nav_layer = """            <nav
              className={cn(
                "flex items-center justify-center gap-2 rounded-full px-1.5 py-1.5 transition-all duration-500",
                ""
              )}
            >"""

new_nav_layer = """            <nav
              className={cn(
                "flex items-center justify-center gap-2 rounded-full px-1.5 py-1.5 transition-all duration-500",
                isOverDark
                  ? "bg-white/[0.04] border border-white/[0.05] shadow-inner"
                  : "bg-black/[0.03] border border-black/[0.04] shadow-inner"
              )}
            >"""

content = content.replace(old_nav_layer, new_nav_layer)

with open(file_path, "w") as f:
    f.write(content)

print("Inner layer added back!")
