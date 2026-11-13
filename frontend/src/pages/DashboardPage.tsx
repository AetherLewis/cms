import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardStats, getMonthlyReport, listAuditLogs } from '../utils/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Button } from '../components/ui/Button'
import { formatCurrency } from '../utils/format'
import { DollarSign, AlertCircle, ArrowUpRight, FileText, Activity } from 'lucide-react'

export function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const now = new Date()
      const months = Array.from({ length: 6 }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1)
        return { date, key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` }
      })
      const [data, reports, logs] = await Promise.all([
        getDashboardStats(),
        Promise.all(months.map(({ key }) => getMonthlyReport(key).catch(() => null))),
        listAuditLogs().catch(() => []),
      ])
      setStats(data)
      setMonthlyData(reports.map((report, index) => ({ name: months[index]?.date.toLocaleDateString(undefined, { month: 'short' }) || '', revenue: Number(report?.total_paid ?? report?.revenue ?? 0) })))
      setActivity((logs || []).slice(0, 5))
    }
    load().catch((error) => console.error('Failed to load dashboard:', error))
  }, [])

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="border-l-4 border-indigo-600 pl-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">Workspace overview</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1><p className="mt-1 text-sm text-slate-500">Your contracts, billing, collections, and client activity.</p></div>
        <div className="flex gap-2"><Button asChild variant="outline"><Link to="/contracts/new">New contract</Link></Button><Button asChild><Link to="/invoices/new">New invoice</Link></Button></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active contracts" value={stats?.active_contracts || 0} icon={<FileText className="h-5 w-5" />} />
        <StatCard label="Total invoiced" value={formatCurrency(stats?.total_invoiced)} icon={<DollarSign className="h-5 w-5" />} />
        <StatCard label="Collected" value={formatCurrency(stats?.total_paid)} icon={<ArrowUpRight className="h-5 w-5" />} />
        <StatCard label="Outstanding" value={formatCurrency(stats?.total_outstanding)} icon={<AlertCircle className="h-5 w-5" />} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-slate-900">Monthly revenue</h2><p className="mt-1 text-sm text-slate-500">Paid invoice totals over the last six months</p></div><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">6 months</span></div><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} /><YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickFormatter={(value: number) => `KSh ${(value / 1000).toFixed(0)}k`} /><Tooltip formatter={(value: number) => [formatCurrency(value), 'Collected']} /><Bar dataKey="revenue" fill="#4338ca" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4"><h2 className="font-semibold text-slate-900">Recent activity</h2><p className="mt-1 text-sm text-slate-500">Latest changes in your workspace</p></div><div className="space-y-4">{activity.map((item: any, index: number) => <div key={item.id || index} className="flex gap-3 border-b border-slate-100 pb-3 last:border-0"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-700"><Activity className="h-4 w-4" /></span><div className="min-w-0"><p className="text-sm font-medium text-slate-800">{item.description || item.action || `${item.resource_type || 'Workspace'} updated`}</p><p className="mt-1 text-xs text-slate-500">{item.created_at ? new Date(item.created_at).toLocaleString() : item.resource_id || 'System'}</p></div></div>)}{!activity.length && <div className="py-12 text-center text-sm text-slate-400">No recent activity available.</div>}</div></section>
      </div>
      <div className="grid gap-5 lg:grid-cols-2"><RecentList title="Recent contracts" items={stats?.recent_contracts || []} to="/contracts" /><RecentList title="Recent invoices" items={stats?.recent_invoices || []} to="/invoices" invoices /></div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm text-slate-500">{label}</p><span className="rounded-md bg-indigo-50 p-2 text-indigo-700">{icon}</span></div><p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{value}</p></article>
}

function RecentList({ title, items, to, invoices = false }: { title: string; items: any[]; to: string; invoices?: boolean }) {
  return <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">{title}</h2><Link className="text-sm font-medium text-indigo-700 hover:text-indigo-900" to={to}>View all</Link></div>{items.slice(0, 5).map((item) => <Link key={item.id} to={`${to}/${item.id}`} className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-3 last:border-0 hover:bg-slate-50"><span className="min-w-0"><span className="block truncate text-sm font-medium text-slate-800">{invoices ? item.invoice_number : item.title}</span><span className="mt-1 block text-xs text-slate-500">{invoices ? `Due ${item.due_date || '—'}` : item.contract_type || 'Standard'}</span></span><span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">{formatCurrency(invoices ? item.total : item.value)}</span></Link>)}{!items.length && <p className="p-8 text-center text-sm text-slate-400">Nothing to show yet.</p>}</section>
}
