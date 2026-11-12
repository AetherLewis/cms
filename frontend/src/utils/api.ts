import { supabase } from '../utils/supabase'
import { toast } from 'react-hot-toast'

function getApiBase() {
  const configured = String(import.meta.env.VITE_API_URL || '/api').trim()
  if (configured === '/api') return configured

  const withProtocol = /^https?:\/\//i.test(configured) ? configured : `https://${configured}`
  return withProtocol.replace(/\/+$/, '').endsWith('/api')
    ? withProtocol.replace(/\/+$/, '')
    : `${withProtocol.replace(/\/+$/, '')}/api`
}

const API_BASE = getApiBase()

/**
 * Lightweight typed fetch wrapper that attaches the JWT from localStorage.
 */
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers instanceof Headers ? Object.fromEntries(options.headers.entries()) : (options.headers as Record<string, string> | undefined) || {}),
  }
  const token = session?.access_token || localStorage.getItem('starcore_token')
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || body.message || `Request failed: ${res.status}`)
  }

  if (res.status === 204) return undefined as T

  const body = await res.json()
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
    return body.data as T
  }
  return body as T
}

/** ---------- Auth ---------- */
export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signup(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
  if (error) throw error
  return data
}

export async function logout() {
  await supabase.auth.signOut()
  // Supabase manages the access token lifecycle.
}

/** ---------- Clients ---------- */
export async function listClients() {
  return request<any[]>('/clients')
}
export async function createClient(payload: any) {
  return request<any>('/clients', { method: 'POST', body: JSON.stringify(payload) })
}
export async function getClient(id: string) {
  return request<any>(`/clients/${id}`)
}
export async function updateClient(id: string, payload: any) {
  return request<any>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}
export async function deleteClient(id: string) {
  return request(`/clients/${id}`, { method: 'DELETE' })
}

/** ---------- Contracts ---------- */
export async function listContracts() {
  return request<any[]>('/contracts')
}
export async function createContract(payload: any) {
  return request<any>('/contracts', { method: 'POST', body: JSON.stringify(payload) })
}
export async function getContract(id: string) {
  return request<any>(`/contracts/${id}`)
}
export async function updateContract(id: string, payload: any) {
  return request<any>(`/contracts/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}
export async function deleteContract(id: string) {
  return request(`/contracts/${id}`, { method: 'DELETE' })
}
export async function getContractStats(id: string) {
  return request<any>(`/contracts/${id}/stats`)
}

/** ---------- Invoices ---------- */
export async function listInvoices() {
  return request<any[]>('/invoices')
}
export async function createInvoice(payload: any) {
  return request<any>('/invoices', { method: 'POST', body: JSON.stringify(payload) })
}
export async function getInvoice(id: string) {
  return request<any>(`/invoices/${id}`)
}
export async function updateInvoice(id: string, payload: any) {
  return request<any>(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}
export async function deleteInvoice(id: string) {
  return request(`/invoices/${id}`, { method: 'DELETE' })
}

/** ---------- Payments ---------- */
export async function listPayments() {
  return request<any[]>('/payments')
}
export async function createPayment(payload: any) {
  return request<any>('/payments', { method: 'POST', body: JSON.stringify(payload) })
}
export async function deletePayment(id: string) {
  return request(`/payments/${id}`, { method: 'DELETE' })
}

/** ---------- Documents ---------- */
export async function listDocuments() {
  return request<any[]>('/documents')
}
export async function createDocument(payload: any) {
  return request<any>('/documents', { method: 'POST', body: JSON.stringify(payload) })
}
export async function deleteDocument(id: string) {
  return request(`/documents/${id}`, { method: 'DELETE' })
}
export async function exportDocument(id: string) {
  return request<any>(`/documents/${id}/export`, { method: 'POST' })
}

/** ---------- Audit ---------- */
export async function listAuditLogs() {
  return request<any[]>('/audit')
}
export async function createAuditLog(payload: any) {
  return request<any>('/audit', { method: 'POST', body: JSON.stringify(payload) })
}

/** ---------- Settings ---------- */
export async function getSettings() {
  return request<any>('/settings')
}
export async function updateSettings(payload: any) {
  return request<any>('/settings', { method: 'PUT', body: JSON.stringify(payload) })
}

/** ---------- Recurring ---------- */
export async function listRecurring() {
  return request<any[]>('/recurring')
}
export async function createRecurring(payload: any) {
  return request<any>('/recurring', { method: 'POST', body: JSON.stringify(payload) })
}
export async function toggleRecurring(id: string, active: boolean) {
  return request<any>(`/recurring/${id}/toggle`, { method: 'PUT', body: JSON.stringify({ active }) })
}

/** ---------- Stats ---------- */
export async function getDashboardStats() {
  return request<any>('/stats/dashboard')
}
export async function getMonthlyReport(month: string) {
  return request<any>(`/stats/monthly?month=${month}`)
}

/** ---------- Automations ---------- */
export type OutreachContact = { identifier: string; type: 'email' | 'phone'; name?: string }
export type OutreachLog = {
  id: string
  run_id: string
  contact_identifier: string
  contact_type: 'email' | 'phone'
  generated_message: string | null
  status: string
  created_at: string
  updated_at: string
}
export async function runOutreach(payload: { contacts: OutreachContact[]; basePrompt: string }) {
  return request<{ runId: string; results: OutreachLog[] }>('/automations/outreach', { method: 'POST', body: JSON.stringify(payload) })
}
export async function listOutreachLogs() {
  return request<OutreachLog[]>('/automations/logs')
}

/** ---------- Workflows ---------- */
export type WorkflowType = 'outreach' | 'invoice_reminder' | 'recurring_invoice'
export type WorkflowStatus = 'draft' | 'active' | 'paused'
export type WorkflowFrequency = 'daily' | 'weekly' | 'monthly'
export type ProviderReadiness = { email: boolean; whatsapp: boolean; ai: boolean }

export type WorkflowRecord = {
  id: string
  name: string
  type: WorkflowType
  status: WorkflowStatus
  timezone: string
  frequency: WorkflowFrequency
  run_time: string
  config: any
  next_run_at: string | null
  last_run_at: string | null
  last_run_status: string | null
  missingProviders: string[]
  created_at: string
  updated_at: string
}

export type WorkflowDefinitionInput = {
  name: string
  type: WorkflowType
  timezone: string
  frequency: WorkflowFrequency
  runTime: string
  config: any
  activate?: boolean
}

export type WorkflowPreview = {
  items: Array<{ label: string; detail: string }>
  missingProviders: string[]
  readyToRun: boolean
  nextRunAt: string | null
}

export type WorkflowRunItem = {
  id: string
  run_id: string
  label: string
  status: 'sent' | 'created' | 'failed' | 'skipped'
  detail: string | null
  created_at: string
}

export type WorkflowRun = {
  id: string
  trigger: 'manual' | 'schedule'
  status: 'running' | 'succeeded' | 'partial' | 'failed' | 'empty'
  total_items: number
  succeeded_items: number
  failed_items: number
  skipped_items: number
  summary: string | null
  started_at: string
  finished_at: string | null
  items: WorkflowRunItem[]
}

export async function listWorkflows() {
  return request<{ workflows: WorkflowRecord[]; readiness: ProviderReadiness }>('/workflows')
}
export async function getWorkflowReadiness() {
  return request<{ readiness: ProviderReadiness }>('/workflows/readiness')
}
export async function getWorkflow(id: string) {
  return request<WorkflowRecord>(`/workflows/${id}`)
}
export async function createWorkflow(payload: WorkflowDefinitionInput) {
  return request<WorkflowRecord>('/workflows', { method: 'POST', body: JSON.stringify(payload) })
}
export async function updateWorkflow(id: string, payload: WorkflowDefinitionInput) {
  return request<WorkflowRecord>(`/workflows/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}
export async function previewWorkflow(payload: WorkflowDefinitionInput) {
  return request<WorkflowPreview>('/workflows/preview', { method: 'POST', body: JSON.stringify(payload) })
}
export async function activateWorkflow(id: string) {
  return request<WorkflowRecord>(`/workflows/${id}/activate`, { method: 'POST' })
}
export async function pauseWorkflow(id: string) {
  return request<WorkflowRecord>(`/workflows/${id}/pause`, { method: 'POST' })
}
export async function runWorkflowNow(id: string) {
  return request<{ runId: string; status: string; totals: { total: number; succeeded: number; failed: number; skipped: number } }>(`/workflows/${id}/run`, { method: 'POST' })
}
export async function listWorkflowRuns(id: string) {
  return request<{ workflow: WorkflowRecord; runs: WorkflowRun[] }>(`/workflows/${id}/runs`)
}
export async function deleteWorkflow(id: string) {
  return request(`/workflows/${id}`, { method: 'DELETE' })
}

/** ---------- Sender profiles (OAuth) ---------- */
export type SenderChannel = 'email' | 'whatsapp'
export type SenderProvider = 'google' | 'meta'
export type SenderStatus = 'connected' | 'expired' | 'revoked'

export type SenderProfile = {
  id: string
  name: string
  channel: SenderChannel
  provider: SenderProvider
  account: string
  status: SenderStatus
  scopes: string[]
  last_connected_at: string | null
  last_error: string | null
  created_at: string
}

export type SenderProviderInfo = {
  provider: SenderProvider
  channel: SenderChannel
  label: string
  configured: boolean
}

export async function listSenders() {
  return request<{ senders: SenderProfile[]; providers: SenderProviderInfo[] }>('/senders')
}
export async function startSenderAuthorization(payload: { channel: SenderChannel; senderId?: string }) {
  return request<{ authorizationUrl: string; provider: SenderProvider }>('/senders/authorize', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
export async function renameSender(id: string, name: string) {
  return request<SenderProfile>(`/senders/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) })
}
export async function disconnectSender(id: string) {
  return request<SenderProfile>(`/senders/${id}/disconnect`, { method: 'POST' })
}

/** ---------- Helper ---------- */
export function currency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export { toast }
