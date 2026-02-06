"use client"

import { useParams } from "next/navigation"
import { EditStandardPageClient } from "./page-client"

export default function EditStandardPage() {
  const { id } = useParams()
  return <EditStandardPageClient standardId={id as string} />
}
