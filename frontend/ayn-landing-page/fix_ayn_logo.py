import re

file_path = "/home/anwar/Projects/Ayn/frontend/ayn-landing-page/components/ayn-logo.tsx"

with open(file_path, "r") as f:
    content = f.read()

# Replace Wordmark function
old_wordmark = """function Wordmark({
  isArabic,
  markOnly,
  heroStyle,
  variant,
}: Pick<AynLogoProps, "isArabic" | "markOnly" | "heroStyle" | "variant">) {
  const gradientClass =
    variant === "on-dark"
      ? "bg-gradient-to-r from-white via-white/90 to-primary"
      : variant === "on-light" || heroStyle
        ? "bg-gradient-to-r from-foreground via-foreground/95 to-primary"
        : "bg-gradient-to-r from-foreground via-foreground/90 to-primary"

  const useGradient = heroStyle || variant === "on-light" || variant === "on-dark"

  if (markOnly) {
    const letter = isArabic ? "ع" : "A"
    return useGradient ? (
      <span className={cn("bg-clip-text font-bold tracking-tight text-transparent", gradientClass)}>
        {letter}
      </span>
    ) : (
      <span className="font-bold tracking-tight text-foreground">
        {isArabic ? (
          <>
            <span>ع</span>
            <span className="text-primary">ي</span>
          </>
        ) : (
          <>
            A<span className="text-primary">y</span>
          </>
        )}
      </span>
    )
  }

  if (useGradient) {
    return (
      <span className={cn("bg-clip-text font-bold tracking-tight text-transparent", gradientClass)}>
        {isArabic ? "عين" : "Ayn"}
      </span>
    )
  }

  return (
    <span className="font-bold tracking-tight text-foreground">
      {isArabic ? (
        <>
          عي<span className="text-primary">ن</span>
        </>
      ) : (
        <>
          Ay<span className="text-primary">n</span>
        </>
      )}
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

content = content.replace(old_wordmark, new_wordmark)

with open(file_path, "w") as f:
    f.write(content)

print("Global Logo fixed!")
