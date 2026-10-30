// Verifies Row Level Security against your real Supabase project.
//   node scripts/verify-rls.mjs
// Optional, for signed-in checks (pass as env vars so they are never stored):
//   NON_MOD_EMAIL / NON_MOD_PASSWORD   an account that is NOT in public.moderators
//   MOD_EMAIL / MOD_PASSWORD           an account that IS in public.moderators
// Every probe is built so it cannot change data even if RLS is broken:
// writes either use an invalid title (cannot save) or set a value to itself (no-op).
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .map((l) => l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/))
    .filter(Boolean)
    .map(([, k, v]) => [k, v.replace(/^["']|["']$/g, '')]),
)
const base = env.VITE_SUPABASE_URL.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
const anon = env.VITE_SUPABASE_ANON_KEY

let failed = 0
const report = (ok, name, detail = '') => {
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`)
}

async function rest(path, { token = anon, method = 'GET', body } = {}) {
  const res = await fetch(`${base}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: anon,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body && JSON.stringify(body),
  })
  const json = await res.json().catch(() => null)
  return { status: res.status, json }
}

async function signIn(email, password) {
  const res = await fetch(`${base}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const json = await res.json()
  if (!json.access_token) throw new Error(`sign-in failed for ${email}: ${json.msg ?? json.error_description ?? res.status}`)
  return json.access_token
}

const rows = (r) => (Array.isArray(r.json) ? r.json.length : 0)

async function commonChecks(label, token) {
  const notApproved = await rest('listings?select=id&status=neq.approved', { token })
  report(rows(notApproved) === 0, `${label}: cannot read pending/rejected listings`, `${rows(notApproved)} rows`)

  // No-op write (status stays 'pending'): if RLS were broken this returns rows.
  const upd = await rest('listings?status=eq.pending', { token, method: 'PATCH', body: { status: 'pending' } })
  report(rows(upd) === 0, `${label}: cannot update listings`, `${rows(upd)} rows, HTTP ${upd.status}`)

  const mods = await rest('moderators?select=user_id', { token })
  report(rows(mods) === 0, `${label}: cannot read the moderators table`, `${rows(mods)} rows`)

  const rpc = await rest('rpc/is_moderator', { token, method: 'POST', body: {} })
  report(rpc.json === false, `${label}: is_moderator() is false`, `got ${JSON.stringify(rpc.json)}`)

  // Invalid title (1 char) so these can never save; a permission error (42501) must win.
  const bad = { title: 'a', category: 'other', image_public_id: 'flyers/rls-check', image_alt: 'rls check' }
  for (const [what, extra] of [
    ['status=approved', { status: 'approved' }],
    ['reviewed_by set', { reviewed_by: '00000000-0000-0000-0000-000000000000' }],
    ['reviewed_at set', { reviewed_at: new Date().toISOString() }],
  ]) {
    const ins = await rest('listings', { token, method: 'POST', body: { ...bad, ...extra } })
    report(ins.json?.code === '42501', `${label}: cannot insert with ${what}`, `HTTP ${ins.status} ${ins.json?.code ?? ''}`)
  }
}

console.log(`Project: ${new URL(base).host}\n`)
await commonChecks('anon', anon)

if (process.env.NON_MOD_EMAIL) {
  console.log('')
  await commonChecks('signed-in non-moderator', await signIn(process.env.NON_MOD_EMAIL, process.env.NON_MOD_PASSWORD))
} else {
  console.log('\nSKIP  signed-in non-moderator checks (set NON_MOD_EMAIL and NON_MOD_PASSWORD)')
}

if (process.env.MOD_EMAIL) {
  console.log('')
  const token = await signIn(process.env.MOD_EMAIL, process.env.MOD_PASSWORD)
  const rpc = await rest('rpc/is_moderator', { token, method: 'POST', body: {} })
  report(rpc.json === true, 'moderator: is_moderator() is true', `got ${JSON.stringify(rpc.json)}`)
  const all = await rest('listings?select=id,status', { token })
  report(Array.isArray(all.json), 'moderator: can read all listings', `${rows(all)} rows`)
  const noop = await rest('listings?status=eq.pending&select=id', { token, method: 'PATCH', body: { status: 'pending' } })
  report(noop.status === 200, 'moderator: can update listings (no-op write)', `${rows(noop)} pending rows matched`)
} else {
  console.log('SKIP  moderator checks (set MOD_EMAIL and MOD_PASSWORD)')
}

console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll checks passed')
process.exit(failed ? 1 : 0)
