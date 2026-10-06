import { NavLink } from 'react-router-dom'

export function AdminNav() {
  return (
    <nav className="admin-nav">
      <NavLink to="/admin" end>Issues</NavLink>
      <NavLink to="/admin/users">Users</NavLink>
      <NavLink to="/admin/statistics">Statistics</NavLink>
    </nav>
  )
}
