import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AdminDashboard } from './pages/AdminDashboard'
import { HomePage } from './pages/HomePage'

export default function App() {
  return <BrowserRouter><Routes><Route path="/" element={<HomePage />} /><Route path="/admin" element={<AdminDashboard />} /></Routes></BrowserRouter>
}

