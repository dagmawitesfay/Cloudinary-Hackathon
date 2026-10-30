import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { AnalyzeResponse } from '../../shared/analyze'
import type { CloudinaryUploadResult } from '../cloudinary/UploadWidget'
import { CATEGORIES } from '../lib/categories'
import { submitListing } from '../lib/listings'
import {
  toEventDate,
  validateListing,
  type FieldErrors,
  type ListingFormValues,
} from '../lib/validateListing'
import { ErrorState } from './states'

interface Props {
  upload: CloudinaryUploadResult
  analysis: AnalyzeResponse
  onSubmitted: () => void
}

function initialValues(analysis: AnalyzeResponse): ListingFormValues {
  const { title, eventDate, location, contact } = analysis.suggestions
  const [date = '', time = ''] = (eventDate ?? '').split('T')
  return {
    title: title ?? '',
    category: '',
    date,
    time,
    location: location ?? '',
    contact: contact ?? '',
    description: '',
    altText: analysis.altText ?? '',
  }
}

const inputClass = (invalid: boolean) =>
  `mt-1 block w-full rounded-lg border px-3 py-2 focus-visible:outline-2 focus-visible:outline-indigo-600 ${
    invalid ? 'border-red-500' : 'border-stone-300'
  }`

function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {required ? <span aria-hidden="true"> *</span> : <span className="font-normal text-stone-500"> (optional)</span>}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-stone-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

export function ListingForm({ upload, analysis, onSubmitted }: Props) {
  const [values, setValues] = useState<ListingFormValues>(() => initialValues(analysis))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const set = (key: keyof ListingFormValues) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }))

  const props = (key: keyof ListingFormValues, hint = false) => ({
    id: key,
    value: values[key],
    onChange: set(key),
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': [hint ? `${key}-hint` : '', errors[key] ? `${key}-error` : ''].filter(Boolean).join(' ') || undefined,
    className: inputClass(Boolean(errors[key])),
  })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaveError(null)
    const found = validateListing(values)
    setErrors(found)
    const firstInvalid = Object.keys(found)[0]
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`#${firstInvalid}`)?.focus()
      return
    }

    setSaving(true)
    try {
      await submitListing({
        title: values.title.trim(),
        description: values.description.trim() || null,
        category: values.category,
        event_date: toEventDate(values.date, values.time),
        location_text: values.location.trim() || null,
        contact: values.contact.trim() || null,
        image_public_id: upload.public_id,
        image_width: upload.width,
        image_height: upload.height,
        image_alt: values.altText.trim(),
        ocr_raw_text: analysis.ocrText ?? null,
        tags: [],
      })
      onSubmitted()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field id="title" label="Title" required error={errors.title}>
        <input type="text" maxLength={120} autoComplete="off" {...props('title')} />
      </Field>

      <Field id="category" label="Category" required error={errors.category}>
        <select {...props('category')}>
          <option value="">Choose a category…</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="date" label="Date" error={errors.date}>
          <input type="date" {...props('date')} />
        </Field>
        <Field id="time" label="Start time">
          <input type="time" {...props('time')} />
        </Field>
      </div>

      <Field id="location" label="Location" error={errors.location}>
        <input type="text" maxLength={300} autoComplete="off" {...props('location')} />
      </Field>

      <Field id="contact" label="Contact" hint="Phone, email, or website." error={errors.contact}>
        <input type="text" maxLength={200} autoComplete="off" {...props('contact', true)} />
      </Field>

      <Field id="description" label="Description" error={errors.description}>
        <textarea rows={4} maxLength={2000} {...props('description')} />
      </Field>

      <Field
        id="altText"
        label="Image description"
        required
        hint="Describe the flyer for people who cannot see it. For example: “Flyer for a free health fair with a doctor and a stethoscope.”"
        error={errors.altText}
      >
        <textarea rows={2} maxLength={300} {...props('altText', true)} />
      </Field>

      {Object.keys(errors).length > 0 && (
        <ErrorState message="Please fix the highlighted fields and submit again." />
      )}
      {saveError && <ErrorState message={saveError} />}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-wait disabled:bg-stone-400"
      >
        {saving ? 'Submitting…' : 'Submit listing'}
      </button>
      <p className="text-sm text-stone-500">
        Your listing will appear once a moderator has reviewed it.
      </p>
    </form>
  )
}
