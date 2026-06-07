/** Static demo data for the landing hero dashboard preview — fictional institution. */

export const HERO_MOCK = {
  institution: "Northbridge University",
  user: {
    initials: "SL",
    displayName: "Sarah L.",
    role: "Quality Manager",
    email: "quality@northbridge.edu",
  },
  greeting: "Good morning",
  brainStatus: "Horus active",
  readinessScore: 72,
  trackedStandards: 4,
  systemHealth: { label: "System health", status: "Optimal", tone: "success" as const },
  reports: { gapAnalyses: 6, total: 8, maxGauge: 12 },
  stats: [
    { label: "Evidence items", value: "124", status: "On track", tone: "blue" as const },
    { label: "Open alerts", value: "2", status: "Review", tone: "amber" as const },
    { label: "Compliance score", value: "72%", status: "Improving", tone: "emerald" as const, gauge: 72 },
    { label: "Gap analyses", value: "6", status: "This cycle", tone: "slate" as const },
  ],
  standards: [
    { name: "ISO 21001:2018", coverage: 68 },
    { name: "NCAAA", coverage: 54 },
    { name: "ABET", coverage: 41 },
    { name: "MOE Frameworks", coverage: 29 },
  ],
  nav: {
    main: ["Dashboard", "Horus AI"],
    compliance: ["Evidence Vault", "Standards Hub", "Gap Analysis"],
    automation: ["Workflow Engine", "Analytics"],
    footer: ["Archive", "Settings"],
  },
} as const
