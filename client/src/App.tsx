import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { TechnicianDashboard } from './pages/TechnicianDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/technician" element={<TechnicianDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}