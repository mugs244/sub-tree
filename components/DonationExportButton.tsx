"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DonationRow {
  id: number
  donor_name: string | null
  donor_phone: string
  amount: number
  currency: string
  status: string
  provider: string
  created_at: Date | string
}

function toCSV(rows: DonationRow[]): string {
  const headers = ["ID", "Donor name", "Phone", "Amount", "Currency", "Provider", "Status", "Date"]
  const lines = rows.map((d) => [
    d.id,
    d.donor_name ?? "Anonymous",
    d.donor_phone,
    d.amount,
    d.currency,
    d.provider,
    d.status,
    new Date(d.created_at).toISOString().slice(0, 10),
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
  return [headers.join(","), ...lines].join("\r\n")
}

export function DonationExportButton() {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const res = await fetch("/api/donations/export")
      if (!res.ok) return
      const { data } = (await res.json()) as { data: DonationRow[] }
      const csv = toCSV(data)
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `donations-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
      {loading
        ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
        : <Download className="h-4 w-4 mr-2" />}
      Export CSV
    </Button>
  )
}
