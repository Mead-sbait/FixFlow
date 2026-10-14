import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from './app/store'
import { NotificationsCenter } from './features/notifications/components/NotificationsCenter'
import { useRealtimeSocket } from './features/notifications/useRealtimeSocket'
import { AdminDashboard } from './pages/AdminDashboard'
import { AdminStatistics } from './pages/AdminStatistics'
import { AdminUsers } from './pages/AdminUsers'
import { HomePage } from './pages/HomePage'
import { TechnicianDashboard } from './pages/TechnicianDashboard'
import { TechnicianIssueDetails } from './pages/TechnicianIssueDetails'

export default function App() {
  useRealtimeSocket()

  const token = useSelector((state: RootState) => state.auth.token)

  return (
    <BrowserRouter>
      {token && (
        <header className="notifications-toolbar">
          <NotificationsCenter />
        </header>
      )}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/technician" element={<TechnicianDashboard />} />
        <Route path="/technician/issues/:id" element={<TechnicianIssueDetails />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/issues" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/statistics" element={<AdminStatistics />} />
      </Routes>
    </BrowserRouter>
  )
}
