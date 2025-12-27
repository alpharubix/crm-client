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
import UpdateContacts from './components/contacts/update-contacts'
import UpdateAccounts from './components/accounts/update-accounts'
import UpdateDeals from './components/deals/update-deals'

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
          <Route path="/update-accounts" element={<UpdateAccounts />} />

          {/* Contacts */}
          <Route path="/contacts" element={<ContactPage />} />
          <Route path="/update-contacts" element={<UpdateContacts />} />

          {/* Deals */}
          <Route path="/deals" element={<DealsPage />} />
          <Route path="/update-deals" element={<UpdateDeals />} />

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
