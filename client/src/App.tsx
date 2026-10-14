import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { RequireAuth } from './components/RequireAuth'
import { useRealtimeSocket } from './features/notifications/useRealtimeSocket'
import { AdminBoard } from './pages/AdminBoard'
import { AdminList } from './pages/AdminList'
import { AdminStatistics } from './pages/AdminStatistics'
import { AdminUsers } from './pages/AdminUsers'
import { CreateIssuePage } from './pages/CreateIssuePage'
import { HomePage } from './pages/HomePage'
import { IssueDetailsPage } from './pages/IssueDetailsPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { TechnicianDashboard } from './pages/TechnicianDashboard'
import { TechnicianIssueDetails } from './pages/TechnicianIssueDetails'
import { UserDashboard } from './pages/UserDashboard'

export default function App() {
  useRealtimeSocket()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route element={<RequireAuth roles={['user']} />}>
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/issues/new" element={<CreateIssuePage />} />
              <Route path="/issues/:id" element={<IssueDetailsPage />} />
            </Route>

            <Route element={<RequireAuth roles={['technician']} />}>
              <Route path="/technician" element={<TechnicianDashboard />} />
              <Route path="/technician/issues/:id" element={<TechnicianIssueDetails />} />
            </Route>

            <Route element={<RequireAuth roles={['admin']} />}>
              <Route path="/admin" element={<AdminBoard />} />
              <Route path="/admin/issues" element={<AdminList />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/statistics" element={<AdminStatistics />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  )
}
