import re

file_path = "/home/anwar/Projects/Ayn/frontend/ayn-landing-page/components/landing/LandingNavbar.tsx"

with open(file_path, "r") as f:
    content = f.read()

old_nav_block = """          {/* ── Desktop Nav Pill (Left-aligned next to logo) ── */}
          <div className="hidden lg:flex flex-1 justify-start ml-12">"""

new_nav_block = """          {/* ── Desktop Nav Pill (Absolute Center) ── */}
          <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2">"""

content = content.replace(old_nav_block, new_nav_block)

with open(file_path, "w") as f:
    f.write(content)

print("Nav moved to center!")
