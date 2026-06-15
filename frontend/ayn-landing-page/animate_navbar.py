import re

file_path = "/home/anwar/Projects/Ayn/frontend/ayn-landing-page/components/landing/LandingNavbar.tsx"

with open(file_path, "r") as f:
    content = f.read()

old_wrapper = """          <motion.div
            layout
            className={cn(
              "pointer-events-auto relative flex items-center justify-between p-1.5 pl-6 pr-1.5 rounded-full transition-all duration-500 max-w-5xl w-full",
              isOverDark
                ? "bg-white/[0.02] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-md"
                : "bg-black/[0.02] border border-black/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md"
            )}
          >"""

new_wrapper = """          <motion.div
            layout
            className={cn(
              "pointer-events-auto relative flex items-center justify-between transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
              isCompact 
                ? "max-w-5xl w-[96%] p-1.5 pl-6 pr-1.5 rounded-full" 
                : "max-w-7xl w-[98%] p-3 pl-8 pr-3 rounded-[2rem] bg-opacity-0 backdrop-blur-none shadow-none border-transparent",
              isOverDark && isCompact
                ? "bg-white/[0.02] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-md"
                : !isOverDark && isCompact 
                ? "bg-black/[0.02] border border-black/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md"
                : ""
            )}
          >"""

content = content.replace(old_wrapper, new_wrapper)

with open(file_path, "w") as f:
    f.write(content)

print("Navbar animation implemented!")
