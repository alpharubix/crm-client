import LeadsPage from '@/features/leads/LeadsPage'
import EditLeads from './components/pages/EditLeads'
import SidebarComponent from './components/sidebar-component'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from './components/ui/sonner'
import AccountPage from './components/accounts'
import NotFoundPage from './components/pages/NotFoundPage'
import ContactPage from './components/pages/ContactPage'
import DealsPage from './components/pages/DealsPage'
import DeskPage from './components/pages/DeskPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SidebarComponent />}>
          {/* Leads */}
          <Route path="/" element={<Navigate to="/leads" replace />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/leads/:id" element={<EditLeads />} />

          {/* Accounts */}
          <Route path="/accounts" element={<AccountPage />} />

          {/* Contacts */}
          <Route path="/contacts" element={<ContactPage />} />

          {/* Deals */}
          <Route path="/deals" element={<DealsPage />} />

          {/* 404 Page */}
          <Route path="*" element={<NotFoundPage />} />

          {/* Desk */}
          <Route path="/desk" element={<DeskPage />} />
        </Route>
      </Routes>
      <Toaster richColors position="top-right" />
    </BrowserRouter>
  )
}
