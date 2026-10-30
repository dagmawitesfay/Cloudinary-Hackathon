// Fails the build if anything server-only ended up in the browser bundle.
//   npm run build && npm run check:secrets
// Checks dist/ for: (1) the actual values of server-only secrets from .env or the
// environment, (2) server-only variable names, (3) Supabase keys that aren't the
// public "anon" role, and (4) source maps or env files.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const dist = join(root, 'dist')
if (!existsSync(dist)) {
  console.error('dist/ not found. Run `npm run build` first.')
  process.exit(2)
}

const SERVER_ONLY = ['CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'SUPABASE_SERVICE_ROLE_KEY']

const fromEnvFile = {}
if (existsSync(join(root, '.env'))) {
  for (const line of readFileSync(join(root, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/)
    if (m) fromEnvFile[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
const secrets = SERVER_ONLY.map((name) => [name, process.env[name] || fromEnvFile[name]]).filter(([, v]) => v && v.length >= 8)

const files = []
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    statSync(p).isDirectory() ? walk(p) : files.push(p)
  }
}
walk(dist)

const problems = []
const jwts = new Map()

for (const file of files) {
  const rel = file.slice(dist.length + 1)
  if (/\.map$/.test(rel)) problems.push(`${rel}: source map shipped (exposes original source)`)
  if (/(^|\/)\.env/.test(rel)) problems.push(`${rel}: env file in dist`)
  if (!/\.(js|css|html|json|txt|svg|map)$/.test(rel)) continue

  const text = readFileSync(file, 'utf8')
  for (const [name, value] of secrets) if (text.includes(value)) problems.push(`${rel}: contains the VALUE of ${name}`)
  for (const name of SERVER_ONLY) if (text.includes(name)) problems.push(`${rel}: mentions server-only variable ${name}`)
  if (/api_secret/i.test(text)) problems.push(`${rel}: mentions api_secret`)

  for (const token of text.match(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g) ?? []) {
    try {
      const role = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).role
      jwts.set(token, role)
      if (role !== 'anon') problems.push(`${rel}: JWT with role "${role}" (only "anon" may be public)`)
    } catch {
      /* not a JWT */
    }
  }
}

console.log(`Scanned ${files.length} files in dist/`)
console.log(secrets.length ? `Checked for the values of: ${secrets.map(([n]) => n).join(', ')}` : 'No server secrets found in .env/environment to compare against (names and key roles still checked)')
for (const role of new Set(jwts.values())) console.log(`Found ${[...jwts.values()].filter((r) => r === role).length} JWT(s) with role "${role}"${role === 'anon' ? ' (the public Supabase key, expected)' : ''}`)

if (problems.length) {
  console.error('\nFAIL')
  for (const p of problems) console.error(`  - ${p}`)
  process.exit(1)
}
console.log('\nPASS: no secrets in dist/')
