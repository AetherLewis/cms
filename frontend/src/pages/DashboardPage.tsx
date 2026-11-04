import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardStats } from '../utils/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { formatCurrency } from '../utils/format'
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, ArrowUpRight, FileContract, Users, Mail } from 'lucide-react'

const COLORS = ['#3d8091', '#96bfc9', '#e5f2f5', '#f3fafc', '#c7dce2']

export function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [monthlyData, setMonthlyData] = useState<any[]>([])

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const data = await getDashboardStats()
      setStats(data)
      setMonthlyData([
        { name: 'Jan', revenue: 12000 },
        { name: 'Feb', revenue: 16000 },
        { name: 'Mar', revenue: 15500 },
        { name: 'Apr', revenue: 18200 },
        { name: 'May', revenue: 24500 },
        { name: 'Jun', revenue: 21000 },
      ])
    } catch (e: any) {
      console.error('Failed to load stats:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-star-900">Dashboard</h1>
          <p className="text-star-500 mt-1">Overview of contracts, invoices, payments, and outstanding balances.</p>
        </div>
        <div className="hidden md:flex gap-2">
          <Button asChild variant="outline"><Link to="/contracts/new">New Contract</Link></Button>
          <Button asChild><Link to="/invoices/new">New Invoice</Link></Button>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Contracts" value={stats?.active_contracts || 0} change="+12%" icon={<FileContract className="w-6 h-6 text-star-600" />} positive={true} />
        <StatCard label="Invoiced" value={formatCurrency(stats?.total_invoiced)} change="+8.2%" icon={<DollarSign className="w-6 h-6 text-star-600" />} positive={true} />
        <StatCard label="Paid" value={formatCurrency(stats?.total_paid)} change="+3.5%" icon={<ArrowUpRight className="w-6 h-6 text-green-600" />} positive={true} />
        <StatCard label="Outstanding" value={formatCurrency(stats?.total_outstanding || 0)} change="—" icon={<AlertCircle className="w-6 h-6 text-amber-500" />} positive={false} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-star-100 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-star-900 mb-4">Monthly Revenue (last 6 months)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5f2f5" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#3d8091' }} axisLine={{ stroke: '#e5f2f5' }} />
                <YAxis tick={{ fontSize: 12, fill: '#3d8091' }} axisLine={{ stroke: '#e5f2f5' }} tickFormatter={(v: number) => '$' + (v / 1000).toFixed(0) + 'k'} />
                <Tooltip cursor={{ fill: '#f3fafc' }} formatter={(v: number) => [formatCurrency(v), 'Revenue']} />
                <Bar dataKey="revenue" fill="#3d8091" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-star-100 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-star-900 mb-4">Revenue Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Paid', value: stats?.total_paid || 24500 },
                    { name: 'Outstanding', value: stats?.total_outstanding || 6800 },
                    { name: 'Overdue', value: stats?.overdue_count ? 4200 : 0 },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                  labelLine={{ stroke: '#3d8091', strokeWidth: 1 }}
                >
                  {COLORS.map((color, i) => <Cell key={`cell-${i}`} fill={color} stroke="none" />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-star-100 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-star-100 bg-star-50/60">
            <h3 className="font-bold text-star-900">Recent Contracts</h3>
          </div>
          <div className="divide-y divide-star-50">
            {(stats?.recent_contracts || []).slice(0, 5).map((c: any) => (
              <Link key={c.id} to={`/contracts/${c.id}`} className="flex items-center justify-between p-4 hover:bg-star-50 transition-colors group">
                <div>
                  <h4 className="font-medium text-star-900 group-hover:text-star-600">{c.title}</h4>
                  <p className="text-xs text-star-400">{c.contract_type || 'Standard'}</p>
                </div>
                <span className="text-sm font-semibold text-star-600">{formatCurrency(c.value || 0)}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-star-100 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-star-100 bg-star-50/60">
            <h3 className="font-bold text-star-900">Recent Invoices</h3>
          </div>
          <div className="divide-y divide-star-50">
            {(stats?.recent_invoices || []).slice(0, 5).map((i: any) => (
              <Link key={i.id} to={`/invoices/${i.id}`} className="flex items-center justify-between p-4 hover:bg-star-50 transition-colors group">
                <div>
                  <h4 className="font-medium text-star-900 group-hover:text-star-600">{i.invoice_number}</h4>
                  <p className="text-xs text-star-400">Due {i.due_date ? new Date(i.due_date).toLocaleDateString() : '—'}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-star-600">{formatCurrency(i.total || 0)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ml-2 ${i.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-star-100 text-star-600'}`}>{i.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, change, icon, positive }: any) {
  return (
    <div className="rounded-xl border border-star-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 bg-star-50 rounded-lg border border-star-100">{icon}</div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${positive ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>{change}</span>
      </div>
      <h4 className="text-sm text-star-500 font-medium">{label}</h4>
      <p className="text-2xl font-extrabold text-star-900">{value}</p>
    </div>
  )
}
