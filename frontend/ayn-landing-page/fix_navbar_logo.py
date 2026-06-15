import re

file_path = "/home/anwar/Projects/Ayn/frontend/ayn-landing-page/components/landing/LandingNavbar.tsx"

with open(file_path, "r") as f:
    content = f.read()

# Replace the logo block in LandingNavbar
# Remove whileHover and adjust font weight from extrabold to bold/semibold
old_logo_block = """          {/* ── Logo (Left) ── */}
          <div className="flex shrink-0 z-50">
            <Link href="/" aria-label="Ayn home" className="group block">
              <motion.div
                whileHover={{ scale: 1.04 }}
                transition={{ type: "spring", stiffness: 400 }}
                className="flex items-center select-none"
              >
                <span
                  className={cn(
                    "text-[1.5rem] font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r",
                    isOverDark
                      ? "from-white to-white/70"
                      : "from-black to-black/70"
                  )}
                >
                  Ayn
                </span>
              </motion.div>
            </Link>
          </div>"""

new_logo_block = """          {/* ── Logo (Left) ── */}
          <div className="flex shrink-0 z-50">
            <Link href="/" aria-label="Ayn home" className="group block">
              <div className="flex items-center select-none">
                <span
                  className={cn(
                    "text-[1.45rem] font-bold tracking-tight",
                    isOverDark
                      ? "text-white"
                      : "text-black"
                  )}
                >
                  Ayn
                </span>
              </div>
            </Link>
          </div>"""

content = content.replace(old_logo_block, new_logo_block)

with open(file_path, "w") as f:
    f.write(content)

print("Landing Navbar Logo fixed!")
