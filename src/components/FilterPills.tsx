import { pillActive, pillIdle } from '../lib/ui'

interface Option {
  value: string
  label: string
}

interface Props {
  label: string
  options: readonly Option[]
  value: string
  onChange: (value: string) => void
}

/** A row of toggle pills; exactly one is active. */
export function FilterPills({ label, options, value, onChange }: Props) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm text-muted">{label}</span>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={o.value === value ? pillActive : pillIdle}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
