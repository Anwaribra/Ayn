/* eslint-disable react-refresh/only-export-components */
import { InstitutionDetailPageClient } from "./page-client"

export async function generateStaticParams() {
  return []
}

export default function InstitutionDetailPage() {
  return <InstitutionDetailPageClient />
}
