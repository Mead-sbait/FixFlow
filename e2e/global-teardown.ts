import { execSync } from 'node:child_process'

// after the whole run, drop the throwaway accounts and their issues so the dev database stays clean
export default function globalTeardown() {
  try {
    const out = execSync('npm run cleanup:e2e --prefix server', { encoding: 'utf8', stdio: 'pipe' })
    const line = out.split('\n').find((l) => l.startsWith('e2e cleanup'))
    if (line) console.log(line)
  } catch (error) {
    console.warn('could not clean up e2e data, run `npm run cleanup:e2e --prefix server` yourself:', (error as Error).message.split('\n')[0])
  }
}
