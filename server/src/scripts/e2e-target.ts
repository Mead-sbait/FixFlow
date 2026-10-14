// decides whether the e2e cleanup may touch the database in MONGODB_URI.
// local servers and databases whose name says test/e2e are fine, anything else is refused
// unless ALLOW_E2E_CLEANUP=yes is set on purpose. Never in production.
export function cleanupAllowed(uri: string, env: Record<string, string | undefined>): { ok: boolean; reason: string } {
  if (env.NODE_ENV === 'production') {
    return { ok: false, reason: 'NODE_ENV is production' }
  }

  let host = ''
  let database = ''
  try {
    const url = new URL(uri)
    host = url.hostname.toLowerCase()
    database = url.pathname.replace(/^\//, '').toLowerCase()
  } catch {
    return { ok: false, reason: 'MONGODB_URI could not be parsed' }
  }

  if (env.ALLOW_E2E_CLEANUP === 'yes') {
    return { ok: true, reason: 'ALLOW_E2E_CLEANUP=yes' }
  }

  const local = host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]'
  if (local) {
    return { ok: true, reason: `local database "${database}" on ${host}` }
  }

  if (/(test|e2e)/.test(database)) {
    return { ok: true, reason: `database "${database}" is named as a test database` }
  }

  return { ok: false, reason: `"${database}" on ${host} is not local and not named as a test database; set ALLOW_E2E_CLEANUP=yes if you really mean it` }
}
