import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <main className="home-page">
      <span className="home-mark" aria-hidden="true">F</span>
      <p className="eyebrow">Maintenance, without the guesswork</p>
      <h1>FixFlow</h1>
      <p>Report maintenance issues, assign the right technician, and keep progress visible from first report to completion.</p>
      <Link className="primary-button home-link" to="/admin?preview=1">Open admin preview <span aria-hidden="true">→</span></Link>
    </main>
  )
}

