import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AdminDashboard } from './pages/AdminDashboard'
import { AdminStatistics } from './pages/AdminStatistics'
import { AdminUsers } from './pages/AdminUsers'
import { HomePage } from './pages/HomePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/statistics" element={<AdminStatistics />} />
      </Routes>
    </BrowserRouter>
  )
}
