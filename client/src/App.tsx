import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { MyIssuesPage } from './pages/MyIssuesPage'
import { CreateIssuePage } from './pages/CreateIssuePage'
import { IssueDetailsPage } from './pages/IssueDetailsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/issues" element={<MyIssuesPage />} />
        <Route path="/issues/new" element={<CreateIssuePage />} />
        <Route path="/issues/:id" element={<IssueDetailsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
