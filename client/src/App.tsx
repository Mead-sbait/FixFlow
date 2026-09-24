import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { TechnicianDashboard } from './pages/TechnicianDashboard'
import { TechnicianIssueDetails } from './pages/TechnicianIssueDetails'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/technician" element={<TechnicianDashboard />} />
        <Route path="/technician/issues/:id" element={<TechnicianIssueDetails />} />
      </Routes>
    </BrowserRouter>
  )
}