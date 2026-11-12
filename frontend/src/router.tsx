import { createBrowserRouter } from 'react-router-dom'
import { Root } from './layout/Root'
import { DashboardPage } from './pages/DashboardPage'
import { ClientsPage } from './pages/ClientsPage'
import { ClientFormPage } from './pages/ClientFormPage'
import { ContractsPage } from './pages/ContractsPage'
import { ContractFormPage } from './pages/ContractFormPage'
import { ContractDetailPage } from './pages/ContractDetailPage'
import { InvoicesPage } from './pages/InvoicesPage'
import { InvoiceFormPage } from './pages/InvoiceFormPage'
import { InvoiceDetailPage } from './pages/InvoiceDetailPage'
import { PaymentsPage } from './pages/PaymentsPage'
import { DocumentsPage } from './pages/DocumentsPage'
import { AuditPage } from './pages/AuditPage'
import { SettingsPage } from './pages/SettingsPage'
import { RecurringPage } from './pages/RecurringPage'
import { ReportsPage } from './pages/ReportsPage'
import { LoginPage } from './pages/LoginPage'
import { WorkflowsPage } from './pages/Workflows/Index'
import { WorkflowFormPage } from './pages/Workflows/WorkflowFormPage'
import { WorkflowHistoryPage } from './pages/Workflows/WorkflowHistoryPage'
import { SendersPage } from './pages/SendersPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'clients/new', element: <ClientFormPage /> },
      { path: 'clients/:id', element: <ClientFormPage /> },
      { path: 'contracts', element: <ContractsPage /> },
      { path: 'contracts/new', element: <ContractFormPage /> },
      { path: 'contracts/:id', element: <ContractFormPage /> },
      { path: 'contracts/:id/view', element: <ContractDetailPage /> },
      { path: 'invoices', element: <InvoicesPage /> },
      { path: 'invoices/new', element: <InvoiceFormPage /> },
      { path: 'invoices/:id', element: <InvoiceFormPage /> },
      { path: 'invoices/:id/view', element: <InvoiceDetailPage /> },
      { path: 'payments', element: <PaymentsPage /> },
      { path: 'documents', element: <DocumentsPage /> },
      { path: 'audit', element: <AuditPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'recurring', element: <RecurringPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'automations', element: <WorkflowsPage /> },
      { path: 'automations/new', element: <WorkflowFormPage /> },
      { path: 'automations/:id', element: <WorkflowFormPage /> },
      { path: 'automations/:id/history', element: <WorkflowHistoryPage /> },
      { path: 'senders', element: <SendersPage /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
])
