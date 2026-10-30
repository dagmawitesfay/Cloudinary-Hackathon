import type { ReactNode } from 'react'
import { sectionTitle } from '../../lib/ui'

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-12 text-muted">
      <span
        aria-hidden="true"
        className="h-5 w-5 rounded-full border-2 border-border-strong border-t-accent motion-safe:animate-spin"
      />
      <span>{label}</span>
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border-strong px-6 py-12 text-center">
      <h2 className={sectionTitle}>{title}</h2>
      {children && <div className="mt-3 text-muted">{children}</div>}
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-xl border border-danger bg-surface px-4 py-3 text-danger">
      {message}
    </div>
  )
}

export function SuccessAlert({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="rounded-xl border border-success bg-surface px-4 py-3 text-success">
      {children}
    </div>
  )
}
