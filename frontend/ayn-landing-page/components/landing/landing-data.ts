import {
  Brain,
  FileCheck,
  Shield,
  BarChart3,
  Zap,
  Users,
  Upload,
  Sparkles,
  FileText,
  Award,
  School,
  GraduationCap,
  Library,
  ShieldCheck,
  Search,
} from "lucide-react"

export const features = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description:
      "Upload your policy documents. Horus Engine compares them against ISO 21001's 10 core requirements and highlights specific gaps in your documentation.",
  },
  {
    icon: FileCheck,
    title: "ISO 21001 & NAQAAE",
    description:
      "Map criteria to ISO 21001 and NAQAAE frameworks. Submit assessments and get reviewer feedback in one place.",
  },
  {
    icon: Shield,
    title: "Evidence Management",
    description:
      "Upload PDFs, images, and docs to a central repository. Link each file to the criterion it supports.",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description:
      "See compliance percentage, assessment progress, and evidence counts per institution on the dashboard.",
  },
  {
    icon: Zap,
    title: "Automated Workflows",
    description:
      "Draft → Submit → Reviewed. Teachers fill criteria; auditors add comments; status updates in one flow.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Roles: Admin, Teacher, Auditor. Institution-scoped access so each school or center sees only its data.",
  },
]

export const workflowSteps = [
  { icon: Upload, title: "Upload Evidence", description: "Collect and organize your documentation" },
  { icon: Sparkles, title: "AI Analysis", description: "Horus Engine analyzes your data" },
  { icon: FileText, title: "Generate Reports", description: "Get detailed insights and recommendations" },
  { icon: Award, title: "Achieve Accreditation", description: "Meet standards with confidence" },
]

export const audienceItems = [
  {
    title: "For Schools",
    icon: School,
    benefits: [
      "Align curricula and policies with national K–12 quality frameworks.",
      "Track teacher qualifications, PD, and classroom evidence in one place.",
      "Prepare for school inspections and accreditation visits with ready evidence.",
      "Involve staff in self-assessment and improvement plans without extra paperwork.",
    ],
  },
  {
    title: "For Universities",
    icon: GraduationCap,
    benefits: [
      "Map programs to ISO 21001 and NAQAAE at the faculty and program level.",
      "Manage program reviews, learning outcomes, and external audit evidence.",
      "Support research and teaching quality with a single evidence repository.",
      "Keep accreditation cycles on track with dashboards and deadline visibility.",
    ],
  },
  {
    title: "For Training Centers",
    icon: Library,
    benefits: [
      "Document competency-based curricula and trainer credentials for auditors.",
      "Link certificates, attendance, and assessments to specific criteria.",
      "Show compliance for vocational and professional certification bodies.",
      "Scale quality across multiple branches with one shared platform.",
    ],
  },
] as const

export const trustBadges = [
  { title: "ISO 21001 Ready", icon: Award },
  { title: "NAQAAE Compatible", icon: ShieldCheck },
  { title: "Evidence-First Approach", icon: Search },
] as const
