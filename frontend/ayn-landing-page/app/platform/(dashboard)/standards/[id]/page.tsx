/* eslint-disable react-refresh/only-export-components */
import { StandardDetailPageClient } from "./page-client"

export async function generateStaticParams() {
  return []
}

export default function StandardDetailPage() {
  return <StandardDetailPageClient />
}
