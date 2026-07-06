import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/auth-context'
import ProtectedRoute, { ProtectedLogRoute } from './components/protected-route'
import PublicRoute from './components/public-routes'
import SidebarComponent from './components/sidebar-component'
import { GlobalProgressBar } from './components/global-progress-bar'
import { Spinner } from './components/ui/spinner'
import DealsKanban from './components/deals/deals-kanban'
import HiringKanban from './components/hiring/hiring-kanban'
import CandidateKanban from './components/hiring/candidate-kanban'
import CreateJobRequirement from './components/hiring/create-job-requirement'
import CreateCandidate from './components/hiring/create-candidate'

// Lazy loaded pages and heavy route components
const AccountPage = lazy(() => import('./pages/accounts-page'))
const ContactPage = lazy(() => import('./pages/contact-page'))
const UpdateAccounts = lazy(
  () => import('./components/accounts/update-accounts'),
)
const UpdateContacts = lazy(
  () => import('./components/contacts/update-contacts'),
)
const NotFoundPage = lazy(() => import('./pages/not-found-page'))
const CreateContact = lazy(() => import('./components/contacts/create-contact'))
const AuditLogs = lazy(() => import('./components/log/audit-log'))
const DealsPage = lazy(() => import('./pages/deals-page'))
const TicketsPage = lazy(() => import('./pages/tickets-page'))
const UpdateDeals = lazy(() => import('./components/deals/update-deals'))
const Project = lazy(() => import('./components/projects/project'))
const Task = lazy(() => import('./components/projects/task'))
const CreateDeal = lazy(() => import('./components/deals/create-deals'))
const SignInPage = lazy(() => import('./pages/signin-page'))
const Export = lazy(() => import('./components/export/export'))
const TicketsKanban = lazy(() => import('./components/tickets/tickets-kanban'))
const CreateTicket = lazy(() => import('./components/tickets/create-ticket'))
const UpdateTicketsKanban = lazy(
  () => import('./components/tickets/update-kanban-tickets'),
)
const UpdateDealsKanban = lazy(
  () => import('./components/deals/update-kanban-deals'),
)
const CreateAccount = lazy(() => import('./components/accounts/create-account'))

const Revenue = lazy(() => import('./pages/revenue'))
const CreateRevenue = lazy(() => import('./components/revenue/create-revenue'))
const UpdateRevenue = lazy(() => import('./components/revenue/update-revenue'))
const BsaAnalysisPage = lazy(() =>
  import('./components/bsa/BsaAnalysisPage').then((module) => ({
    default: module.BsaAnalysisPage,
  })),
)

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <GlobalProgressBar />
        <Suspense
          fallback={
            <div className='flex justify-center items-center h-screen'>
              <Spinner className='h-10 w-10' />
            </div>
          }
        >
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path='/' element={<Navigate to='/login' replace />} />
              <Route path='/login' element={<SignInPage />} />
            </Route>

            <Route
              element={
                <ProtectedRoute>
                  <SidebarComponent />
                </ProtectedRoute>
              }
            >
              <Route path='/accounts' element={<AccountPage />} />
              <Route path='/accounts/:id' element={<UpdateAccounts />} />
              <Route path='/accounts/:id/bsa' element={<BsaAnalysisPage />} />
              <Route path='/accounts/create' element={<CreateAccount />} />
              <Route path='/contacts' element={<ContactPage />} />
              <Route path='/contacts/:id' element={<UpdateContacts />} />
              <Route path='/contacts-create' element={<CreateContact />} />
              <Route path='/deals' element={<DealsPage />} />
              <Route path='/deals-create' element={<CreateDeal />} />
              {/* /deals/:id */}
              <Route path='/deals/:id' element={<UpdateDeals />} />
              <Route path='/kanban-deals' element={<DealsKanban />} />

              <Route path='/tickets' element={<TicketsPage />} />
              <Route path='/kanban-tickets' element={<TicketsKanban />} />
              <Route path='/tickets/:id' element={<UpdateTicketsKanban />} />
              <Route
                path='/deals/:dealId/tickets/create'
                element={<CreateTicket />}
              />
              <Route path='/revenue' element={<Revenue />} />
              <Route path='/revenue-create' element={<CreateRevenue />} />
              <Route path='/revenue/:id' element={<UpdateRevenue />} />
              <Route path='/hiring' element={<HiringKanban />} />
              <Route path='/hiring-create' element={<CreateJobRequirement />} />
              <Route
                path='/hiring/:id/edit'
                element={<CreateJobRequirement />}
              />
              <Route path='/candidate-create' element={<CreateCandidate />} />
              <Route path='/candidate/:id/edit' element={<CreateCandidate />} />
              <Route path='/jr/:jrId' element={<CandidateKanban />} />
              <Route element={<ProtectedLogRoute />}>
                <Route path='/audit-logs' element={<AuditLogs />} />
              </Route>

              <Route path='/projects' element={<Project />} />
              <Route path='/projects/:id' element={<Task />} />
              <Route path='/exports' element={<Export />} />
              <Route path='*' element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
