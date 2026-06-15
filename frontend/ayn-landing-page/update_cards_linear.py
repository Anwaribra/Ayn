import re

file_path = "/home/anwar/Projects/Ayn/frontend/ayn-landing-page/components/landing/AnalysisEngineFeatures.tsx"

with open(file_path, "r") as f:
    content = f.read()

old_card_class = """                "group relative rounded-3xl border border-border/60 bg-card/50 p-8 overflow-hidden hover:bg-card/80 hover:-translate-y-0.5 transition-all duration-500 will-change-accel","""

new_card_class = """                "group relative rounded-3xl border border-border/40 bg-card/40 backdrop-blur-md p-8 overflow-hidden hover:bg-card/60 hover:-translate-y-1 transition-all duration-500 will-change-accel shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),_0_8px_30px_rgba(0,0,0,0.1)]","""

content = content.replace(old_card_class, new_card_class)

with open(file_path, "w") as f:
    f.write(content)

print("Cards updated to Linear Glass Style!")
