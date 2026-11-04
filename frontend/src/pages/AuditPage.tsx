import { useState, useEffect } from 'react'
import { listAuditLogs } from '../utils/api'
import { Badge } from '../components/ui/Badge'
import { formatDate } from '../utils/format'
import { ShieldCheck, User } from 'lucide-react'

export function AuditPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadAudit()
  }, [])

  async function loadAudit() {
    setLoading(true)
    try {
      const data = await listAuditLogs()
      setItems(data || [])
    } catch (e: any) {
      console.error('Failed to load audit logs:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-star-900">Audit Log</h1>
        <p className="text-star-500 mt-1">Full history of user actions across contracts, invoices, and clients.</p>
      </div>

      <div className="rounded-xl border border-star-100 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-star-400">Loading audit history…</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-star-400">No audit entries found.</div>
        ) : (
          <div className="divide-y divide-star-100">
            {items.map((log: any) => (
              <div key={log.id} className="flex items-start gap-4 px-6 py-4 hover:bg-star-50 transition-colors">
                <div className="w-9 h-9 bg-star-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-star-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-star-900">{log.action}</span>
                    <Badge status={log.entity_type} label={log.entity_type.toUpperCase()} />
                  </div>
                  <p className="text-sm text-star-500">{log.entity_id}</p>
                  <div className="flex items-center gap-2 text-xs text-star-400 mt-1">
                    <User className="w-3 h-3" /> {log.user_id || 'system'}
                    <span>•</span>
                    <span>{formatDate(log.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
