import re

file_path = "/home/anwar/Projects/Ayn/frontend/ayn-landing-page/components/landing/LandingNavbar.tsx"

with open(file_path, "r") as f:
    content = f.read()

# Fix outer wrapper width
old_wrapper = """        <motion.div
          layout
          className={cn(
            "pointer-events-auto relative flex items-center justify-between transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
            isCompact 
              ? "max-w-4xl w-[90%] md:w-[80%] p-1.5 pl-6 pr-1.5 rounded-full mt-0" 
              : "max-w-6xl w-[96%] p-3 pl-8 pr-3 rounded-[2rem] mt-2",
            isOverDark
              ? "bg-white/[0.02] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl"
              : "bg-black/[0.02] border border-black/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-xl"
          )}
        >"""

new_wrapper = """        <motion.div
          layout
          className={cn(
            "pointer-events-auto relative flex items-center justify-between transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
            isCompact 
              ? "max-w-[880px] w-[95%] p-1.5 pl-6 pr-1.5 rounded-full mt-0" 
              : "max-w-[1100px] w-[96%] p-3 pl-8 pr-3 rounded-[2rem] mt-2",
            isOverDark
              ? "bg-white/[0.02] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl"
              : "bg-black/[0.02] border border-black/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-xl"
          )}
        >"""

content = content.replace(old_wrapper, new_wrapper)

# Fix middle section position
old_middle = """          {/* ── Desktop Nav Pill (Absolute Center) ── */}
          <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2">"""

new_middle = """          {/* ── Desktop Nav Pill (Shifted slightly left) ── */}
          <div className="hidden lg:flex flex-1 justify-start ml-8 xl:ml-16">"""

content = content.replace(old_middle, new_middle)

with open(file_path, "w") as f:
    f.write(content)

print("Navbar width and alignment fixed!")
