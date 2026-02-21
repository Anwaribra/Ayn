"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  memo,
  useMemo,
} from "react"
import { Plus, Send } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

// ===== TYPES =====

export type MenuOption = "Auto" | "Max" | "Search" | "Plan"

const PLACEHOLDERS = [
  "Ask about your compliance gaps...",
  "Upload a document for analysis...",
  "What are my ISO 21001 requirements?",
  "Summarize my evidence status...",
  "How do I improve my compliance score?",
  "Check my NAQAAE readiness...",
];

const letterVariants = {
  initial: { opacity: 0, filter: "blur(8px)", y: 6 },
  animate: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: {
      opacity: { duration: 0.2 },
      filter: { duration: 0.3 },
      y: { type: "spring", stiffness: 80, damping: 20 },
    },
  },
  exit: {
    opacity: 0,
    filter: "blur(8px)",
    y: -6,
    transition: { opacity: { duration: 0.15 }, filter: { duration: 0.2 } },
  },
};


interface RippleEffect {
  x: number
  y: number
  id: number
}

interface Position {
  x: number
  y: number
}

export interface PromptInputDynamicGrowProps {
  placeholder?: string
  onSubmit?: (value: string) => void
  disabled?: boolean
  glowIntensity?: number
  expandOnFocus?: boolean
  animationDuration?: number
  textColor?: string
  backgroundOpacity?: number
  showEffects?: boolean
  menuOptions?: MenuOption[]
  /** Optional slot to render left of the input (e.g. attach button) */
  leftSlot?: React.ReactNode
  /** Optional slot to render right of send (e.g. stop button) */
  rightSlot?: React.ReactNode
}

interface InputAreaProps {
  value: string
  setValue: React.Dispatch<React.SetStateAction<string>>
  placeholder: string
  handleKeyDown: (e: React.KeyboardEvent) => void
  disabled: boolean
  isSubmitDisabled: boolean
  textColor: string
}

interface GlowEffectsProps {
  glowIntensity: number
  mousePosition: Position
  animationDuration: number
  enabled: boolean
}

interface RippleEffectsProps {
  ripples: RippleEffect[]
  enabled: boolean
}

interface MenuButtonProps {
  toggleMenu: () => void
  menuRef: React.RefObject<HTMLDivElement>
  isMenuOpen: boolean
  onSelectOption: (option: MenuOption) => void
  textColor: string
  menuOptions: MenuOption[]
}

interface SendButtonProps {
  isDisabled: boolean
  textColor: string
}

interface OptionsMenuProps {
  isOpen: boolean
  onSelect: (option: MenuOption) => void
  textColor: string
  menuOptions: MenuOption[]
}

interface OptionTagProps {
  option: MenuOption
  onRemove: (option: MenuOption) => void
  textColor: string
}

interface SelectedOptionsProps {
  options: MenuOption[]
  onRemove: (option: MenuOption) => void
  textColor: string
}

// ===== CONTEXT =====

interface ChatInputContextProps {
  mousePosition: Position
  ripples: RippleEffect[]
  addRipple: (x: number, y: number) => void
  animationDuration: number
  glowIntensity: number
  textColor: string
  showEffects: boolean
}

const ChatInputContext = createContext<ChatInputContextProps | undefined>(undefined)

function useChatInputContext() {
  const context = useContext(ChatInputContext)
  if (context === undefined) {
    throw new Error("useChatInputContext must be used within a ChatInputProvider")
  }
  return context
}

// ===== COMPONENTS =====

const SendButton = memo(({ isDisabled, textColor }: SendButtonProps) => (
  <button
    type="submit"
    aria-label="Send message"
    disabled={isDisabled}
    className="ml-auto self-center h-8 w-8 flex items-center justify-center rounded-full border-0 p-0 transition-all z-20 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground bg-primary text-primary-foreground hover:opacity-100 cursor-pointer hover:shadow-lg"
  >
    <Send className="w-4 h-4" strokeWidth={2} />
  </button>
))

const OptionsMenu = memo(({ isOpen, onSelect, textColor, menuOptions }: OptionsMenuProps) => {
  if (!isOpen) return null
  return (
    <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-lg shadow-lg overflow-hidden z-30 min-w-[120px]">
      <ul className="py-1">
        {menuOptions.map((option) => (
          <li
            key={option}
            className="px-4 py-2 hover:bg-muted cursor-pointer text-sm font-medium"
            style={{ color: textColor }}
            onClick={() => onSelect(option)}
          >
            {option}
          </li>
        ))}
      </ul>
    </div>
  )
})

const OptionTag = memo(({ option, onRemove, textColor }: OptionTagProps) => (
  <div
    className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-muted"
    style={{ color: textColor }}
  >
    <span>{option}</span>
    <button
      type="button"
      onClick={() => onRemove(option)}
      className="h-4 w-4 flex items-center justify-center rounded-full hover:bg-muted-foreground/20"
      style={{ color: textColor }}
    >
      <span className="sr-only">Remove</span>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </button>
  </div>
))

const GlowEffects = memo(({ glowIntensity, mousePosition, animationDuration, enabled }: GlowEffectsProps) => {
  if (!enabled) return null
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-r from-white/8 via-white/12 to-white/8 dark:from-white/5 dark:via-white/8 dark:to-white/5 backdrop-blur-2xl rounded-3xl" />
      <div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none"
        style={{
          transition: `opacity ${animationDuration}ms`,
          boxShadow: `0 0 0 1px rgba(147, 51, 234, ${0.2 * glowIntensity}), 0 0 8px rgba(147, 51, 234, ${0.3 * glowIntensity}), 0 0 16px rgba(236, 72, 153, ${0.2 * glowIntensity}), 0 0 24px rgba(59, 130, 246, ${0.15 * glowIntensity})`,
        }}
      />
      <div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none blur-sm"
        style={{
          background: `radial-gradient(circle 120px at ${mousePosition.x}% ${mousePosition.y}%, rgba(147,51,234,0.08) 0%, rgba(236,72,153,0.05) 30%, rgba(59,130,246,0.04) 60%, transparent 100%)`,
        }}
      />
      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-15 group-focus-within:opacity-10 transition-opacity duration-300 bg-gradient-to-r from-purple-400/5 via-pink-400/5 to-blue-400/5 blur-sm" />
    </>
  )
})

const RippleEffects = memo(({ ripples, enabled }: RippleEffectsProps) => {
  if (!enabled || ripples.length === 0) return null
  return (
    <>
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="absolute pointer-events-none blur-sm"
          style={{ left: ripple.x - 25, top: ripple.y - 25, width: 50, height: 50 }}
        >
          <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-400/15 via-pink-400/10 to-blue-400/15 animate-ping" />
        </div>
      ))}
    </>
  )
})

const InputArea = memo(({
  value,
  setValue,
  placeholder,
  handleKeyDown,
  disabled,
  isSubmitDisabled,
  textColor,
}: InputAreaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [showPlaceholder, setShowPlaceholder] = useState(true)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      const scrollHeight = textareaRef.current.scrollHeight
      const lineHeight = 22
      const maxHeight = lineHeight * 4 + 16
      textareaRef.current.style.height = Math.min(scrollHeight, maxHeight) + "px"
    }
  }, [value])

  useEffect(() => {
    if (value || isInputFocused) return;

    const interval = setInterval(() => {
      setShowPlaceholder(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        setShowPlaceholder(true);
      }, 400);
    }, 3000);

    return () => clearInterval(interval);
  }, [value, isInputFocused]);

  return (
    <div className="flex-1 relative h-full flex items-center">
      <div className="relative flex-1 flex w-full min-w-0">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={""}
          aria-label="Message Input"
          rows={1}
          className="w-full min-h-8 max-h-24 bg-transparent text-sm font-normal text-left self-center border-0 outline-none px-3 pr-10 py-1 z-20 relative resize-none overflow-y-auto placeholder:text-transparent"
          style={{ color: textColor, letterSpacing: "-0.14px", lineHeight: "22px" }}
          disabled={disabled}
        />
        <AnimatePresence mode="wait">
          {showPlaceholder && !value && !isInputFocused && (
            <motion.span
              key={placeholderIndex}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm pointer-events-none select-none whitespace-nowrap z-10"
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ staggerChildren: 0.025 }}
            >
              {PLACEHOLDERS[placeholderIndex].split("").map((char, i) => (
                <motion.span
                  key={i}
                  variants={letterVariants}
                  style={{ display: "inline-block" }}
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <SendButton isDisabled={isSubmitDisabled} textColor={textColor} />
    </div>
  )
})

const MenuButton = memo(({
  toggleMenu,
  menuRef,
  isMenuOpen,
  onSelectOption,
  textColor,
  menuOptions,
}: MenuButtonProps) => (
  <div className="relative" ref={menuRef}>
    <button
      type="button"
      onClick={toggleMenu}
      aria-label="Menu options"
      className="h-8 w-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-all ml-1 mr-1"
      style={{ color: textColor }}
    >
      <Plus size={16} />
    </button>
    <OptionsMenu isOpen={isMenuOpen} onSelect={onSelectOption} textColor={textColor} menuOptions={menuOptions} />
  </div>
))

const SelectedOptions = memo(({ options, onRemove, textColor }: SelectedOptionsProps) => {
  if (options.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 mt-2 pl-3 pr-3 z-20 relative">
      {options.map((option) => (
        <OptionTag key={option} option={option} onRemove={onRemove} textColor={textColor} />
      ))}
    </div>
  )
})

export default function PromptInputDynamicGrow({
  placeholder = "Message…",
  onSubmit = () => { },
  disabled = false,
  glowIntensity = 0.4,
  expandOnFocus = true,
  animationDuration = 500,
  textColor = "hsl(var(--foreground))",
  backgroundOpacity = 0.15,
  showEffects = true,
  menuOptions = [] as MenuOption[],
  leftSlot,
  rightSlot,
}: PromptInputDynamicGrowProps) {
  const [value, setValue] = useState("")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<MenuOption[]>([])
  const [ripples, setRipples] = useState<RippleEffect[]>([])
  const [mousePosition, setMousePosition] = useState<Position>({ x: 50, y: 50 })

  const containerRef = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const throttleRef = useRef<number | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (value.trim() && !disabled) {
        onSubmit(value.trim())
        setValue("")
      }
    },
    [value, onSubmit, disabled]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSubmit(e as unknown as React.FormEvent)
      }
    },
    [handleSubmit]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!showEffects || !containerRef.current) return
      if (throttleRef.current) return
      throttleRef.current = window.setTimeout(() => {
        const rect = containerRef.current?.getBoundingClientRect()
        if (rect) {
          const x = ((e.clientX - rect.left) / rect.width) * 100
          const y = ((e.clientY - rect.top) / rect.height) * 100
          setMousePosition({ x, y })
        }
        throttleRef.current = null
      }, 50)
    },
    [showEffects]
  )

  const addRipple = useCallback(
    (x: number, y: number) => {
      if (!showEffects || ripples.length >= 5) return
      const newRipple: RippleEffect = { x, y, id: Date.now() }
      setRipples((prev) => [...prev, newRipple])
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id))
      }, 600)
    },
    [ripples.length, showEffects]
  )

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        addRipple(e.clientX - rect.left, e.clientY - rect.top)
      }
    },
    [addRipple]
  )

  const toggleMenu = useCallback(() => setIsMenuOpen((prev) => !prev), [])
  const selectOption = useCallback((option: MenuOption) => {
    setSelectedOptions((prev) => (prev.includes(option) ? prev : [...prev, option]))
    setIsMenuOpen(false)
  }, [])
  const removeOption = useCallback((option: MenuOption) => {
    setSelectedOptions((prev) => prev.filter((o) => o !== option))
  }, [])

  const contextValue = useMemo(
    () => ({
      mousePosition,
      ripples,
      addRipple,
      animationDuration,
      glowIntensity,
      textColor,
      showEffects,
    }),
    [mousePosition, ripples, addRipple, animationDuration, glowIntensity, textColor, showEffects]
  )

  const isSubmitDisabled = disabled || !value.trim()
  const hasModeSelected = selectedOptions.length > 0
  const shouldExpandOnFocus = expandOnFocus && !hasModeSelected
  const baseWidthClass = hasModeSelected ? "w-full max-w-md" : "w-full max-w-sm"
  const focusWidthClass = shouldExpandOnFocus ? "focus-within:max-w-md" : ""

  return (
    <ChatInputContext.Provider value={contextValue}>
      <form
        onSubmit={handleSubmit}
        className={`flex flex-col min-h-12 ${baseWidthClass} ${focusWidthClass} transition-all ease-out`}
        style={{ transitionDuration: `${animationDuration}ms` }}
      >
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          className="relative flex flex-col w-full min-h-full backdrop-blur-xl shadow-lg rounded-3xl p-2 overflow-visible group border border-border bg-background/80 hover:bg-background/90"
          style={{
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            transition: `all ${animationDuration}ms ease, box-shadow ${animationDuration}ms ease`,
          }}
        >
          <GlowEffects
            glowIntensity={glowIntensity}
            mousePosition={mousePosition}
            animationDuration={animationDuration}
            enabled={showEffects}
          />
          <RippleEffects ripples={ripples} enabled={showEffects} />

          <div className="flex items-center relative z-20">
            {leftSlot}
            {menuOptions.length > 0 && (
              <MenuButton
                toggleMenu={toggleMenu}
                menuRef={menuRef as React.RefObject<HTMLDivElement>}
                isMenuOpen={isMenuOpen}
                onSelectOption={selectOption}
                textColor={textColor}
                menuOptions={menuOptions}
              />
            )}
            <InputArea
              value={value}
              setValue={setValue}
              placeholder={placeholder}
              handleKeyDown={handleKeyDown}
              disabled={disabled}
              isSubmitDisabled={isSubmitDisabled}
              textColor={textColor}
            />
            {rightSlot}
          </div>

          <SelectedOptions options={selectedOptions} onRemove={removeOption} textColor={textColor} />
        </div>
      </form>
    </ChatInputContext.Provider>
  )
}
