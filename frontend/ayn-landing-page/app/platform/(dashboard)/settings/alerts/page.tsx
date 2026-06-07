"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useUserPreferences } from "@/hooks/use-user-preferences"
import { useUiLanguage } from "@/lib/ui-language-context"
import { cn } from "@/lib/utils"

interface AlertSettings {
  complianceNotifications: boolean
  horusTriggers: boolean
  gapAlerts: boolean
  evidenceReminders: boolean
}

const defaults: AlertSettings = {
  complianceNotifications: true,
  horusTriggers: true,
  gapAlerts: true,
  evidenceReminders: false,
}

export default function NeuralAlertsPage() {
  return (
    <ProtectedRoute>
      <NeuralAlertsContent />
    </ProtectedRoute>
  )
}

function NeuralAlertsContent() {
  const { isArabic } = useUiLanguage()
  const { preferences, isLoading, error, mutate, savePreferences } = useUserPreferences()

  const settings = useMemo<AlertSettings>(
    () => ({
      complianceNotifications: preferences.complianceNotifications ?? defaults.complianceNotifications,
      horusTriggers: preferences.horusTriggers ?? defaults.horusTriggers,
      gapAlerts: preferences.gapAlerts ?? defaults.gapAlerts,
      evidenceReminders: preferences.evidenceReminders ?? defaults.evidenceReminders,
    }),
    [preferences]
  )

  const update = async (key: keyof AlertSettings, value: boolean) => {
    try {
      await savePreferences({ [key]: value })
      toast.success(isArabic ? "تم حفظ الإعدادات" : "Settings saved")
    } catch {
      toast.error(isArabic ? "فشل حفظ الإعدادات" : "Failed to save settings")
    }
  }

  return (
    <div className={cn("animate-fade-in-up pb-20 platform-container-narrow px-4", isArabic && "font-arabic")} dir={isArabic ? "rtl" : "ltr"}>
      <Link
        href="/platform/settings"
        className="inline-flex items-center gap-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-sm font-medium mb-8"
      >
        <ArrowLeft className={cn("w-4 h-4", isArabic && "rotate-180")} />
        {isArabic ? "العودة إلى الإعدادات" : "Back to Settings"}
      </Link>

      <header className="mb-10">
        <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
          {isArabic ? "التنبيهات" : "Neural"} <span className="text-[var(--text-tertiary)] font-light">{isArabic ? "الذكية" : "Alerts"}</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          {isArabic ? "تكوين إشعارات الامتثال ومحفزات هوروس" : "Configure compliance notifications and Horus triggers"}
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm text-[var(--text-secondary)]">
            {isArabic ? "فشل تحميل تفضيلات التنبيهات." : "Failed to load your alert preferences."}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void mutate()}
          >
            {isArabic ? "إعادة المحاولة" : "Retry"}
          </Button>
        </div>
      )}

      <div className="glass-panel p-6 rounded-2xl glass-border space-y-6">
        {isLoading && (
          <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-4 py-3 text-xs text-muted-foreground">
            {isArabic ? "جاري مزامنة تفضيلات التنبيهات..." : "Syncing alert preferences..."}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-[var(--text-secondary)] font-medium">{isArabic ? "إشعارات الامتثال" : "Compliance Notifications"}</Label>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{isArabic ? "تلقي تنبيهات عند تغير حالة الامتثال" : "Receive alerts when compliance status changes"}</p>
          </div>
          <Switch
            checked={settings.complianceNotifications}
            disabled={isLoading}
            onCheckedChange={(v) => void update("complianceNotifications", v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-[var(--text-secondary)] font-medium">{isArabic ? "محفزات هوروس" : "Horus Triggers"}</Label>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{isArabic ? "السماح لذكاء هوروس بإرسال توصيات استباقية" : "Allow Horus AI to send proactive recommendations"}</p>
          </div>
          <Switch
            checked={settings.horusTriggers}
            disabled={isLoading}
            onCheckedChange={(v) => void update("horusTriggers", v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-[var(--text-secondary)] font-medium">{isArabic ? "تنبيهات الفجوات" : "Gap Alerts"}</Label>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{isArabic ? "إشعار عند اكتشاف فجوات امتثال جديدة" : "Notify when new compliance gaps are detected"}</p>
          </div>
          <Switch
            checked={settings.gapAlerts}
            disabled={isLoading}
            onCheckedChange={(v) => void update("gapAlerts", v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-[var(--text-secondary)] font-medium">{isArabic ? "تذكيرات الأدلة" : "Evidence Reminders"}</Label>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{isArabic ? "تذكر بربط الأدلة بالمعايير" : "Remind to link evidence to criteria"}</p>
          </div>
          <Switch
            checked={settings.evidenceReminders}
            disabled={isLoading}
            onCheckedChange={(v) => void update("evidenceReminders", v)}
          />
        </div>
      </div>
    </div>
  )
}
