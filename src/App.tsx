// import LeadsPage from './pages/leads-page'
// import EditLeads from '@/components/accounts/edit-leads'
import SidebarComponent from './components/sidebar-component'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from './components/ui/sonner'
import AccountPage from './pages/accounts-page'
import NotFoundPage from './pages/not-found-page'
import ContactPage from './pages/contact-page'
import DealsPage from './pages/deals-page'
import DeskPage from './pages/desk-page'
import StaticAccountView from './components/accounts/update-accounts'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SidebarComponent />}>

          <Route path="/" element={<Navigate to="/accounts" replace />} />

          {/* Leads */}
          {/* <Route path="/leads" element={<LeadsPage />} /> */}
          {/* <Route path="/leads/:id" element={<EditLeads />} /> */}

          {/* Accounts */}
          <Route path="/accounts" element={<AccountPage />} />
          <Route path="/update-accounts" element={<StaticAccountView />} />

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
