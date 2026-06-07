"use client";

import {
  type ReactNode,
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import {
  Search,
  User,
  LogOut,
  Sun,
  Moon,
  Languages,
} from "lucide-react";
import { useTheme } from "next-themes";
import PlatformSidebar from "@/components/platform/sidebar-enhanced";
import { MobileBottomNav } from "@/components/platform/mobile-bottom-nav";
import { MobileNavRadial } from "@/components/platform/mobile-nav-radial";
import { CommandPalette } from "./command-palette";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useCommandPaletteContext } from "@/components/platform/command-palette-provider";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { useFocusMode } from "@/lib/focus-mode-context";
import { useUiLanguage } from "@/lib/ui-language-context";
import type { Notification } from "@/types";
import { cn } from "@/lib/utils";
import { OPEN_AI_PROVIDER_PICKER_EVENT } from "@/lib/ai-provider-preference";
import { AiProviderPickerDialog } from "./ai-provider-picker-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
export default function PlatformShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isWindowVisible, setIsWindowVisible] = useState(true);
  const [aiProviderPickerOpen, setAiProviderPickerOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { setOpen: setCommandPaletteOpen } = useCommandPaletteContext();
  const { focusMode } = useFocusMode();
  const { isArabic, setLanguage } = useUiLanguage();
  const { resolvedTheme, setTheme } = useTheme();

  useCommandPalette();

  const platformTheme = resolvedTheme ?? "dark";
  const isDark = mounted ? resolvedTheme === "dark" : true;

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleToggle = () => setSidebarOpen(prev => !prev);
    window.addEventListener("toggle-platform-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-platform-sidebar", handleToggle);
  }, []);

  const contentScrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = contentScrollAreaRef.current;
    if (!container) return;
    const onScroll = () => {
      setHeaderScrolled(container.scrollTop > 10);
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const container = contentScrollAreaRef.current;
    if (container) {
      container.scrollTop = 0;
      setHeaderScrolled(false);
    }
  }, [pathname]);

  useEffect(() => {
    const updateVisibility = () => setIsWindowVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  const { data: notifications, mutate: mutateNotifications } = useSWR<Notification[]>(
    isAuthenticated && user ? [`notifications`, user.id] : null,
    () => api.getNotifications(),
    {
      refreshInterval: isWindowVisible ? 30_000 : 0,
      revalidateOnFocus: false,
    },
  );

  const notificationCount = useMemo(
    () => notifications?.filter((n: Notification) => !n.isRead).length ?? 0,
    [notifications],
  );

  const platformVisualMode = useMemo(() => {
    if (!pathname) return "default";
    const modes = ["horus-ai", "analytics", "evidence", "standards", "dashboard"];
    for (const mode of modes) if (pathname.includes(`/${mode}`)) return mode;
    return "default";
  }, [pathname]);

  const isHorusAi = pathname?.includes("/horus-ai");

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={cn(
        "flex h-screen overflow-hidden selection:bg-primary/20 relative transition-colors duration-500 bg-background",
      )}
      data-section="platform"
      data-platform-theme={platformTheme}
      data-platform-page={platformVisualMode}
    >
      <div className="cinematic-bg" aria-hidden />

      {!focusMode && (
        <PlatformSidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          notificationCount={notificationCount}
        />
      )}

      {!focusMode && !isHorusAi && (
        <MobileBottomNav />
      )}

      {!focusMode && (
        <MobileNavRadial />
      )}

        <main className="flex-1 flex flex-col relative min-w-0 overflow-hidden">
          {/* Header — sidebar-inspired glass */}
        {!isHorusAi && (
          <header
            className={cn(
              "absolute top-0 inset-x-0 z-30 grid grid-cols-[1fr_auto] lg:grid-cols-3 items-center gap-3 px-4 py-2.5 transition-all duration-300 sm:px-5",
              headerScrolled
                ? "border-b backdrop-blur-lg border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-sm shadow-black/5"
                : "bg-transparent border-b border-transparent",
            )}
          >
            <div className="hidden lg:block" aria-hidden />

            {/* Center section: Search Bar centered perfectly */}
            <div className="flex items-center justify-center min-w-0">
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                className="command-center-trigger group flex w-full max-w-sm items-center gap-2.5 px-3 py-2 text-[13px] sm:max-w-md"
              >
                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                <span className="truncate text-muted-foreground">{isArabic ? "ابحث عن أي شيء..." : "Search for anything..."}</span>
                <div className="ms-auto hidden items-center gap-0.5 opacity-50 sm:flex">
                  <kbd className="rounded bg-foreground/8 px-1 py-0.5 font-mono text-[9px] font-semibold">⌘</kbd>
                  <kbd className="rounded bg-foreground/8 px-1 py-0.5 font-mono text-[9px] font-semibold">K</kbd>
                </div>
              </button>
            </div>

            {/* Right section: Profile dropdown */}
            <div className="flex items-center justify-end">
              {user && (
                <>
                  {/* Mobile Profile Dropdown */}
                  <div className="lg:hidden shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-primary shadow-sm transition-all duration-200 hover:bg-primary/15 hover:shadow hover:scale-[1.03] active:scale-[0.97]"
                        >
                          <User className="h-[15px] w-[15px]" strokeWidth={2.5} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align={isArabic ? "start" : "end"}
                        className="w-52 rounded-xl bg-background/95 backdrop-blur-xl border border-border/50 shadow-xl p-1.5 z-50"
                      >
                        <DropdownMenuItem
                          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium cursor-pointer"
                        >
                          {resolvedTheme === "dark" ? (
                            <Sun size={15} className="text-muted-foreground" />
                          ) : (
                            <Moon size={15} className="text-muted-foreground" />
                          )}
                          {resolvedTheme === "dark"
                            ? (isArabic ? "مظهر فاتح" : "Light mode")
                            : (isArabic ? "مظهر داكن" : "Dark mode")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setLanguage(isArabic ? "en" : "ar")}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium cursor-pointer"
                        >
                          <Languages size={15} className="text-muted-foreground" />
                          {isArabic ? "English" : "العربية"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="mx-2 my-1 bg-border/50" />
                        <DropdownMenuItem
                          onClick={() => router.push("/platform/settings/account")}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium cursor-pointer"
                        >
                          <User size={15} className="text-muted-foreground" />
                          {isArabic ? "الملف الشخصي" : "Profile"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="mx-2 my-1 bg-border/50" />
                        <DropdownMenuItem
                          onClick={async () => {
                            await logout()
                            window.location.href = "/"
                          }}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-destructive cursor-pointer"
                        >
                          <LogOut size={15} />
                          {isArabic ? "تسجيل الخروج" : "Sign out"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Desktop Profile Dropdown */}
                  <div className="hidden lg:block shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-primary shadow-sm transition-all duration-200 hover:bg-primary/15 hover:shadow hover:scale-[1.03] active:scale-[0.97]"
                        >
                          <User className="h-[15px] w-[15px]" strokeWidth={2.5} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align={isArabic ? "start" : "end"}
                        className="w-52 rounded-xl bg-background/95 backdrop-blur-xl border border-border/50 shadow-xl p-1.5 z-50"
                      >
                        <DropdownMenuItem
                          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium cursor-pointer"
                        >
                          {resolvedTheme === "dark" ? (
                            <Sun size={15} className="text-muted-foreground" />
                          ) : (
                            <Moon size={15} className="text-muted-foreground" />
                          )}
                          {resolvedTheme === "dark"
                            ? (isArabic ? "مظهر فاتح" : "Light mode")
                            : (isArabic ? "مظهر داكن" : "Dark mode")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setLanguage(isArabic ? "en" : "ar")}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium cursor-pointer"
                        >
                          <Languages size={15} className="text-muted-foreground" />
                          {isArabic ? "English" : "العربية"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="mx-2 my-1 bg-border/50" />
                        <DropdownMenuItem
                          onClick={() => router.push("/platform/settings/account")}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium cursor-pointer"
                        >
                          <User size={15} className="text-muted-foreground" />
                          {isArabic ? "الملف الشخصي" : "Profile"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="mx-2 my-1 bg-border/50" />
                        <DropdownMenuItem
                          onClick={async () => {
                            await logout()
                            window.location.href = "/"
                          }}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-destructive cursor-pointer"
                        >
                          <LogOut size={15} />
                          {isArabic ? "تسجيل الخروج" : "Sign out"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </>
              )}
            </div>
          </header>
        )}

          {/* Content Area */}
          <div 
            ref={contentScrollAreaRef}
            className={cn(
              "flex-1 custom-scrollbar",
              isHorusAi ? "h-full overflow-hidden" : "overflow-y-auto px-4 pb-28 lg:pb-8 pt-[60px] sm:px-5 content-scroll-area"
            )}
          >
          <div
          className={cn(
              "mx-auto w-full animate-fade-in platform-page",
              isHorusAi && "h-full platform-container-full",
            )}
          >
            {children}
          </div>
        </div>
      </main>

      <AiProviderPickerDialog open={aiProviderPickerOpen} onOpenChange={setAiProviderPickerOpen} />
      <CommandPalette />

      {/* Global CSS for some effects */}
      <style jsx global>{`
        .command-center-trigger {
          box-shadow: 0 2px 10px -2px rgba(0,0,0,0.05);
        }
        .command-center-trigger:hover {
          box-shadow: 0 8px 20px -4px rgba(0,0,0,0.1);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
