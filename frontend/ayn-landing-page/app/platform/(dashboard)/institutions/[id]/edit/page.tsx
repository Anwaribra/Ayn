"use client"

import { useParams } from "next/navigation"
import { EditInstitutionPageClient } from "./page-client"

export default function EditInstitutionPage() {
  const { id } = useParams()
  return <EditInstitutionPageClient institutionId={id as string} />
}
