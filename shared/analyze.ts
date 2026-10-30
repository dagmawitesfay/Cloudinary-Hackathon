// Contract between /api/analyze and the client. Every field is optional:
// the form must work even when OCR and captioning both fail.

export type AddonStatus = 'ok' | 'unavailable' | 'error'

export interface FlyerSuggestions {
  title?: string
  /** Local date-time, `YYYY-MM-DDTHH:mm` (or `YYYY-MM-DD`), ready for a date input. */
  eventDate?: string
  location?: string
  contact?: string
}

export interface AnalyzeResponse {
  suggestions: FlyerSuggestions
  altText?: string
  ocrText?: string
  status: { ocr: AddonStatus; caption: AddonStatus }
}

/** Uploads land here (set by the upload preset). Also enforced in the DB. */
export const FLYER_PUBLIC_ID = /^flyers\/[A-Za-z0-9_\-/]{1,240}$/
