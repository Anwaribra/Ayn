import re

# 1. Update ayn-logo.tsx
file_path_1 = "/home/anwar/Projects/Ayn/frontend/ayn-landing-page/components/ayn-logo.tsx"
with open(file_path_1, "r") as f:
    content_1 = f.read()

old_wordmark = """function Wordmark({
  isArabic,
  markOnly,
  heroStyle,
  variant,
}: Pick<AynLogoProps, "isArabic" | "markOnly" | "heroStyle" | "variant">) {
  const colorClass = 
    variant === "on-dark" ? "text-white" : 
    variant === "on-light" ? "text-black dark:text-black" : 
    "text-foreground"

  if (markOnly) {
    const letter = isArabic ? "ع" : "A"
    return (
      <span className={cn("font-bold tracking-tight", colorClass)}>
        {letter}
      </span>
    )
  }

  return (
    <span className={cn("font-bold tracking-tight", colorClass)}>
      {isArabic ? "عين" : "Ayn"}
    </span>
  )
}"""

new_wordmark = """function Wordmark({
  isArabic,
  markOnly,
  heroStyle,
  variant,
}: Pick<AynLogoProps, "isArabic" | "markOnly" | "heroStyle" | "variant">) {
  const colorClass = 
    variant === "on-dark" ? "text-white" : 
    variant === "on-light" ? "text-black dark:text-black" : 
    "text-foreground"

  if (markOnly) {
    const letter = isArabic ? "ع" : "A"
    return (
      <span className={cn("font-bold tracking-tight", colorClass)}>
        {letter}<span className="text-primary">.</span>
      </span>
    )
  }

  return (
    <span className={cn("font-bold tracking-tight", colorClass)}>
      {isArabic ? (
        <>عي<span className="text-primary">ن.</span></>
      ) : (
        <>Ay<span className="text-primary">n.</span></>
      )}
    </span>
  )
}"""

content_1 = content_1.replace(old_wordmark, new_wordmark)
with open(file_path_1, "w") as f:
    f.write(content_1)


# 2. Update LandingNavbar.tsx
file_path_2 = "/home/anwar/Projects/Ayn/frontend/ayn-landing-page/components/landing/LandingNavbar.tsx"
with open(file_path_2, "r") as f:
    content_2 = f.read()

old_landing_logo = """<span
                  className={cn(
                    "text-[1.45rem] font-bold tracking-tight",
                    isOverDark
                      ? "text-white"
                      : "text-black"
                  )}
                >
                  Ayn
                </span>"""

new_landing_logo = """<span
                  className={cn(
                    "text-[1.45rem] font-bold tracking-tight",
                    isOverDark
                      ? "text-white"
                      : "text-black"
                  )}
                >
                  Ay<span className="text-primary">n.</span>
                </span>"""

content_2 = content_2.replace(old_landing_logo, new_landing_logo)
with open(file_path_2, "w") as f:
    f.write(content_2)

print("All logos updated to consistent Ay[n.] style!")
