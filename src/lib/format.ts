const dateOnly = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
const dateTime = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

/** "Sat, Nov 14, 2026" or with a time. Midnight means "no time given". */
export function formatEventDate(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0
  return (hasTime ? dateTime : dateOnly).format(d)
}

const shortDate = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
const shortDateTime = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

/** Compact, locale-fixed date for the share image ("Sat, Nov 14, 10:00 AM"). */
export function formatShareDate(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0
  return (hasTime ? shortDateTime : shortDate).format(d)
}
