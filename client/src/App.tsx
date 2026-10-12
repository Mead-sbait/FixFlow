import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { TechnicianDashboard } from './pages/TechnicianDashboard'
import { TechnicianIssueDetails } from './pages/TechnicianIssueDetails'
import { useRealtimeSocket } from './features/notifications/useRealtimeSocket'
import { NotificationsCenter } from './features/notifications/components/NotificationsCenter'
import { useSelector } from 'react-redux'
import type { RootState } from './app/store'

export default function App()
{
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
      </Routes>
    </BrowserRouter>
  )
}