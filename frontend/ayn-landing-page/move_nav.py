import re

file_path = "/home/anwar/Projects/Ayn/frontend/ayn-landing-page/components/landing/LandingNavbar.tsx"

with open(file_path, "r") as f:
    content = f.read()

old_nav_block = """          {/* ── Desktop Nav Pill (Absolute Center) ── */}
          <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2">"""

new_nav_block = """          {/* ── Desktop Nav Pill (Left-aligned next to logo) ── */}
          <div className="hidden lg:flex flex-1 justify-start ml-12">"""

content = content.replace(old_nav_block, new_nav_block)

# Also remove `justify-between` if it conflicts with `flex-1`, actually `justify-between` with `flex-1` in the middle works fine because the middle takes all space and pushes the last item to the right. But let's leave `justify-between` on the parent, it's safe.

with open(file_path, "w") as f:
    f.write(content)

print("Nav moved to left!")
