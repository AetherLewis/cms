import { useEffect, useState } from 'react'
import { getMonthlyReport } from '../utils/api'
import { toast } from 'react-hot-toast'

interface MonthlyReport {
  month: string
  total_invoiced: number
  total_paid: number
  total_outstanding: number
  invoice_count: number
}

export function ReportsPage() {
  const [report, setReport] = useState<MonthlyReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const month = new Date().toISOString().slice(0, 7)
    getMonthlyReport(month)
      .then(setReport)
      .catch((error) => toast.error(error.message || 'Failed to load report'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-star-900">Reports</h1>
        <p className="mt-1 text-star-500">Review your current month&apos;s invoice activity.</p>
      </header>
      {loading ? (
        <div className="rounded-xl border border-star-100 bg-white p-8 text-star-500">Loading report...</div>
      ) : report ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Monthly report summary">
          {[
            ['Invoices', report.invoice_count],
            ['Invoiced', report.total_invoiced],
            ['Paid', report.total_paid],
            ['Outstanding', report.total_outstanding],
          ].map(([label, value]) => (
            <article key={label} className="rounded-xl border border-star-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-star-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-star-900">
                {label === 'Invoices' ? value : `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              </p>
            </article>
          ))}
        </section>
      ) : (
        <div className="rounded-xl border border-star-100 bg-white p-8 text-star-500">No report data available.</div>
      )}
    </main>
  )
}
