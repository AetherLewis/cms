export type Role = 'admin' | 'manager' | 'viewer'
export type ContractStatus = 'draft' | 'active' | 'completed' | 'terminated' | 'cancelled'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type PaymentMethod = 'bank_transfer' | 'card' | 'check' | 'cash' | 'other'

export interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: Role
  created_at: string
}

export interface Client {
  id: string
  user_id: string
  name: string
  email: string
  phone?: string
  address?: string
  company?: string
  tax_id?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Contract {
  id: string
  user_id: string
  client_id: string
  title: string
  description?: string
  contract_type?: string
  status: ContractStatus
  start_date?: string
  end_date?: string
  value?: number
  currency?: string
  payment_terms?: string
  file_url?: string
  document_id?: string
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  id?: string
  invoice_id?: string
  description: string
  quantity: number
  unit_price: number
  total?: number
}

export interface Invoice {
  id: string
  user_id: string
  client_id: string
  contract_id?: string
  document_id?: string
  invoice_number: string
  status: InvoiceStatus
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  due_date?: string
  issued_date?: string
  paid_date?: string
  created_at: string
  updated_at: string
  items?: InvoiceItem[]
}

export interface Payment {
  id: string
  invoice_id: string
  amount: number
  payment_date: string
  payment_method: PaymentMethod
  reference?: string
  notes?: string
  created_at: string
}

export interface DashboardStats {
  total_clients: number
  active_contracts: number
  total_contract_value: number
  total_invoiced: number
  total_paid: number
  total_outstanding: number
  overdue_count: number
  recent_invoices: Invoice[]
  recent_contracts: Contract[]
}
