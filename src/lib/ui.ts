// Shared class strings for DESIGN.md components. Tokens only, no raw colors.

export const pageTitle = 'font-display text-5xl tracking-wide leading-none'
export const sectionTitle = 'font-display text-3xl tracking-wide'
export const muted = 'text-sm text-muted'

const button =
  'inline-flex items-center justify-center rounded-full px-6 py-3 font-bold transition-colors ' +
  'disabled:cursor-not-allowed disabled:opacity-60'

/** One primary CTA per view. */
export const buttonPrimary = `${button} bg-accent text-bg hover:bg-accent-hover`
export const buttonSecondary = `${button} border border-border-strong bg-transparent text-text hover:border-text`

export const input =
  'mt-1 block w-full rounded-lg border bg-surface px-3 py-2 text-text transition-colors ' +
  'focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-accent'
export const inputOk = 'border-border-strong'
export const inputInvalid = 'border-danger'

export const panel = 'rounded-2xl border border-border bg-surface p-6 sm:p-8'
export const note = 'rounded-xl border border-border bg-surface px-4 py-3 text-sm'
