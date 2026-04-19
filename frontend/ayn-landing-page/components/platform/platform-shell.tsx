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
  Bell,
  X,
  PanelLeft,
} from "lucide-react";
import { useTheme } from "next-themes";
import PlatformSidebar from "@/components/platform/sidebar-enhanced";
import FloatingAIBar from "@/components/platform/floating-ai-bar";
import { AnimatedThemeToggle } from "@/components/platform/animated-theme-toggle";
import { LanguageToggle } from "@/components/platform/language-toggle";
import { CommandPalette } from "./command-palette";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useCommandPaletteContext } from "@/components/platform/command-palette-provider";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { useFocusMode } from "@/lib/focus-mode-context";
import { useUiLanguage } from "@/lib/ui-language-context";
import type { Notification } from "@/types";
import { cn } from "@/lib/utils";

export default function PlatformShell({ children }: { children: ReactNode }) {
  // Start closed so mobile never shows sidebar taking space on first paint
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [isWindowVisible, setIsWindowVisible] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const { setOpen: setCommandPaletteOpen } = useCommandPaletteContext();
  const { focusMode } = useFocusMode();
  const { isArabic } = useUiLanguage();
  const { resolvedTheme } = useTheme();
  // Enable global keyboard shortcuts (⌘K to open command palette)
  useCommandPalette();

  const platformTheme = resolvedTheme ?? "dark";
  const shellText = useMemo(
    () => ({
      openSidebar: isArabic ? "فتح الشريط الجانبي" : "Open sidebar",
      search: isArabic ? "ابحث..." : "Search…",
      activity: isArabic ? "النشاط" : "Activity",
      markAllRead: isArabic ? "تعيين الكل كمقروء" : "Mark all read",
      quiet: isArabic ? "لا جديد الآن." : "Quiet for now.",
      viewAllActivity: isArabic ? "عرض كل النشاط" : "View All Activity",
      view: isArabic ? "عرض" : "View",
      failedMarkRead: isArabic ? "تعذر تعيين الكل كمقروء" : "Failed to mark all as read",
      failedSingleRead: isArabic ? "تعذر تعيين الإشعار كمقروء" : "Failed to mark as read",
    }),
    [isArabic],
  );

  // Auto-close sidebar when viewport is below lg (sidebar becomes overlay, no reserved width)
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
    const onScroll = () => {
      const next = window.scrollY > 8;
      setHeaderScrolled(next);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const updateVisibility = () => {
      setIsWindowVisible(document.visibilityState === "visible");
    };

    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () =>
      document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  // Close dropdowns when clicking outside or pressing ESC
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        showNotifications &&
        !target.closest(".notification-dropdown-container")
      ) {
        setShowNotifications(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (showNotifications) setShowNotifications(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showNotifications]);

  // Notification data via SWR
  const { data: notifications, mutate: mutateNotifications } = useSWR<
    Notification[]
  >(
    isAuthenticated && user ? [`notifications`, user.id] : null,
    () => api.getNotifications(),
    {
      refreshInterval: isWindowVisible ? (showNotifications ? 15_000 : 30_000) : 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 15_000,
    },
  );
  const notificationCount = useMemo(
    () => notifications?.filter((n: Notification) => !n.isRead).length ?? 0,
    [notifications],
  );

  // Live Toast for New Notifications
  const lastShownAt = useRef<number>(Date.now());
  useEffect(() => {
    const unread = notifications?.filter((n: Notification) => !n.isRead) || [];
    if (unread.length > 0) {
      const latest = unread[0];
      const latestTime = new Date(latest.createdAt).getTime();

      if (latestTime > lastShownAt.current) {
        lastShownAt.current = latestTime;
        toast(latest.title, {
          description: latest.message,
          action: {
            label: shellText.view,
            onClick: () => {
              if (latest.relatedEntityType === "evidence")
                router.push("/platform/evidence");
              else if (latest.relatedEntityType === "gap")
                router.push("/platform/gap-analysis");
              else router.push("/platform/notifications");
            },
          },
        });
      }
    }
  }, [notifications, router, shellText.view]);

  const handleClearNotifications = useCallback(async () => {
    try {
      await api.markAllNotificationsRead();
      mutateNotifications(
        notifications?.map((n: Notification) => ({ ...n, isRead: true })) ?? [],
        { revalidate: false },
      );
    } catch {
      toast.error(shellText.failedMarkRead);
    }
  }, [mutateNotifications, notifications, shellText.failedMarkRead]);

  useEffect(() => {
    if (
      showNotifications &&
      notifications?.some((n: Notification) => !n.isRead)
    ) {
      handleClearNotifications();
    }
  }, [showNotifications, notifications, handleClearNotifications]);

  const handleDismissNotification = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      mutateNotifications(
        notifications?.map((n: Notification) =>
          n.id === id ? { ...n, isRead: true } : n,
        ) ?? [],
        { revalidate: false },
      );
      const notification = notifications?.find(
        (n: Notification) => n.id === id,
      );
      if (
        notification?.relatedEntityId &&
        notification.relatedEntityType === "evidence"
      ) {
        router.push("/platform/evidence");
      } else if (
        notification?.relatedEntityId &&
        notification.relatedEntityType === "report"
      ) {
        router.push(
          `/platform/gap-analysis?report=${notification.relatedEntityId}`,
        );
      }
    } catch {
      toast.error(shellText.failedSingleRead);
    }
  };

  const platformVisualMode = useMemo(() => {
    if (!pathname) return "default";
    if (pathname.includes("/horus-ai")) return "horus";
    if (pathname.includes("/analytics")) return "analytics";
    if (pathname.includes("/evidence")) return "evidence";
    if (pathname.includes("/standards")) return "standards";
    if (pathname.includes("/dashboard")) return "dashboard";
    return "default";
  }, [pathname]);

  return (
    <div
      className={cn(
        "flex h-screen overflow-hidden selection:bg-primary/30 relative transition-colors duration-300",
      )}
      data-section="platform"
      data-platform-theme={platformTheme}
      data-platform-page={platformVisualMode}
    >
      {/* 🌌 Shared Platform Background Layer */}
      <div className="cinematic-bg" />

      {/* Backdrop when sidebar is overlay (below lg) */}
      <div
        className={cn(
          "glass-overlay-backdrop fixed inset-0 z-40 lg:hidden transition-opacity duration-300",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      {/* Body scroll lock when mobile sidebar is open */}
      {sidebarOpen && (
        <style>{`@media (max-width: 1023px) { body { overflow: hidden; } }`}</style>
      )}

      {!focusMode && (
        <PlatformSidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          notificationCount={notificationCount}
        />
      )}

      <main
        id="main-content"
        className="flex-1 flex flex-col relative transition-all duration-300 ease-in-out w-full max-w-[100vw] overflow-x-hidden min-w-0 lg:ml-0"
      >
        <div
          className={cn(
            "flex-1 overflow-y-auto scroll-smooth transition-colors duration-300",
            pathname?.includes("/horus-ai")
              ? "content-scroll-area min-h-0"
              : "px-4 sm:px-6 md:px-10 pt-3 sm:pt-4 pb-24 content-scroll-area",
          )}
        >
          <div
            className={
              pathname?.includes("/horus-ai")
                ? "h-full w-full"
                : "max-w-[1280px] w-full mx-auto"
            }
          >
            {!pathname?.includes("/horus-ai") ? (
              <div
                className={cn(
                  "sticky top-0 z-20 mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3 glass-flyout rounded-[var(--radius-xl)] px-2.5 sm:px-3 py-2",
                  headerScrolled && "shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
                )}
              >
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="glass-button glass-text-secondary lg:hidden min-h-[44px] min-w-[44px] rounded-xl p-2 transition-colors hover:text-[var(--glass-text-primary)]"
                  aria-label={shellText.openSidebar}
                >
                  <PanelLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setCommandPaletteOpen(true)}
                  className="flex-1 flex items-center gap-2 px-3 py-2 rounded-2xl glass-button text-muted-foreground text-sm transition-all group min-h-[44px] min-w-0 shadow-sm"
                >
                  <Search className="w-4 h-4 group-hover:text-foreground transition-colors" />
                  <span className={cn("hidden sm:inline font-medium", isArabic && "font-arabic")}>{shellText.search}</span>
                  <kbd className="glass-pill glass-text-secondary ml-auto hidden items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold sm:flex">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </button>

                <div className="flex items-center gap-1 rounded-[22px] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-1 shadow-[0_12px_32px_-18px_rgba(15,23,42,0.28)] backdrop-blur-xl">
                <AnimatedThemeToggle />
                <LanguageToggle />

                <div className="relative notification-dropdown-container">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={cn(
                      "relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[16px] border border-transparent text-[var(--glass-text-secondary)] transition-all duration-200 hover:-translate-y-0.5 hover:text-[var(--glass-text-primary)]",
                      showNotifications || notificationCount > 0
                        ? "border-[var(--status-warning-border)] bg-[linear-gradient(180deg,rgba(245,158,11,0.12),rgba(245,158,11,0.04))] text-[var(--status-warning)] shadow-[0_10px_24px_-16px_rgba(245,158,11,0.4)]"
                        : "hover:bg-[var(--glass-soft-bg)]"
                    )}
                    aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount} unread)` : ""}`}
                    aria-haspopup="true"
                    aria-expanded={showNotifications}
                  >
                    <Bell className="h-[17px] w-[17px]" strokeWidth={2.05} />
                    {notificationCount > 0 && (
                      <span className="absolute right-[9px] top-[9px] h-2 w-2 rounded-full bg-primary ring-2 ring-[var(--layer-1)]" />
                    )}
                  </button>

                  {showNotifications && (
                    <div className="glass-flyout absolute top-full right-0 z-50 mt-2 w-[calc(100vw-1rem)] max-w-[320px] rounded-3xl p-4 shadow-2xl animate-in slide-in-from-top-2 duration-300 sm:p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                          {shellText.activity}
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleClearNotifications}
                            className="text-[10px] text-primary font-bold hover:underline min-h-[32px] px-1"
                          >
                            {shellText.markAllRead}
                          </button>
                          <button
                            onClick={() => setShowNotifications(false)}
                            className="glass-button glass-text-secondary min-h-[32px] min-w-[32px] rounded-lg p-1 transition-colors hover:text-[var(--glass-text-primary)]"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {!notifications || notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 opacity-60">
                            <Bell className="w-8 h-8 text-muted-foreground mb-3" />
                            <p className="text-center text-muted-foreground italic text-sm">
                              {shellText.quiet}
                            </p>
                          </div>
                        ) : (
                          notifications.slice(0, 8).map((n: Notification) => (
                            <div
                              key={n.id}
                              className={cn(
                                "glass-button flex gap-3 group cursor-pointer p-3 rounded-xl transition-all",
                                !n.isRead
                                  ? "glass-panel"
                                  : "opacity-70",
                              )}
                              onClick={() => handleDismissNotification(n.id)}
                            >
                              <div
                                className={cn(
                                  "w-1 h-full min-h-[2rem] rounded-full flex-shrink-0",
                                  !n.isRead
                                    ? n.type === "error"
                                      ? "bg-destructive"
                                      : n.type === "success"
                                        ? "bg-emerald-500"
                                        : "bg-primary"
                                    : "bg-muted-foreground/30",
                                )}
                              />
                              <div className="flex-1 min-w-0">
                                <h4
                                  className={cn(
                                    "text-xs font-bold",
                                    !n.isRead
                                      ? "text-foreground"
                                      : "text-muted-foreground",
                                  )}
                                >
                                  {n.title}
                                </h4>
                                <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                                  {n.message}
                                </p>
                                <span className="text-[9px] text-muted-foreground/70 mt-1.5 block font-bold uppercase tracking-wider">
                                  {new Date(n.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              {!n.isRead && (
                                <div
                                  className={cn(
                                    "w-2 h-2 rounded-full mt-1.5",
                                    n.type === "error"
                                      ? "bg-destructive"
                                      : n.type === "success"
                                        ? "bg-emerald-500"
                                        : "bg-primary",
                                  )}
                                />
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {notifications && notifications.length > 0 && (
                        <button
                          onClick={() => {
                            setShowNotifications(false);
                            router.push("/platform/notifications");
                          }}
                          className="glass-button glass-text-secondary mt-4 w-full rounded-2xl py-3 text-center text-[10px] font-bold uppercase tracking-widest transition-colors hover:text-[var(--glass-text-primary)]"
                        >
                          {shellText.viewAllActivity}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-2xl glass-panel glass-border text-muted-foreground transition-colors hover:text-foreground"
                aria-label={shellText.openSidebar}
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            )}
            {children}
          </div>
        </div>
      </main>

      <FloatingAIBar />
      <CommandPalette />
    </div>
  );
}
