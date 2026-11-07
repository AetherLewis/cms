import { supabase } from '../utils/supabase'
import { toast } from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

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
  return res.json()
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

/** ---------- Helper ---------- */
export function currency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export { toast }
