// POST /api/analyze { publicId } → OCR + AI caption suggestions for an uploaded flyer.
// Always answers 200 with whatever it could get; the form never depends on this.
import { FLYER_PREFIX, FLYER_PUBLIC_ID, type AddonStatus, type AnalyzeResponse } from '../shared/analyze.js'
import { isConfigured, updateWithAddons, type AnalysisInfo } from './_lib/cloudinaryAdmin.js'
import { parseFlyer } from './_lib/parseFlyer.js'

const OCR = { ocr: 'adv_ocr' }
const CAPTION = { detection: 'captioning' }

function readOcr(info?: AnalysisInfo): string | undefined {
  const ocr = info?.ocr?.adv_ocr
  if (ocr?.status !== 'complete') return undefined
  return ocr.data?.[0]?.textAnnotations?.[0]?.description?.trim() || undefined
}

function readCaption(info?: AnalysisInfo): string | undefined {
  const cap = info?.detection?.captioning
  if (cap?.status !== 'complete') return undefined
  return cap.data?.caption?.trim() || undefined
}

// 'unavailable' = the add-on ran but found nothing; 'error' = the call failed
// (add-on not enabled, quota, network).
const statusFor = (value: string | undefined, ok: boolean): AddonStatus =>
  value ? 'ok' : ok ? 'unavailable' : 'error'

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => null)) as { publicId?: unknown } | null
  const publicId = body?.publicId
  if (typeof publicId !== 'string' || !FLYER_PUBLIC_ID.test(publicId)) {
    return Response.json({ error: `publicId must be an uploaded flyer (${FLYER_PREFIX}...)` }, { status: 400 })
  }
  if (!isConfigured()) {
    console.error('analyze: Cloudinary credentials are not set')
    return Response.json({ error: 'Analysis is not configured' }, { status: 503 })
  }

  let ocrText: string | undefined
  let caption: string | undefined
  let ocrOk: boolean
  let captionOk: boolean

  // One call for both add-ons; if it fails (e.g. one add-on isn't enabled),
  // retry each separately so a working add-on still contributes.
  const both = await updateWithAddons(publicId, { ...OCR, ...CAPTION })
  if (both.httpStatus === 404) return Response.json({ error: 'Upload not found' }, { status: 404 })
  if (both.ok) {
    ocrText = readOcr(both.info)
    caption = readCaption(both.info)
    ocrOk = captionOk = true
  } else {
    console.warn('analyze: combined call failed, retrying separately:', both.error)
    const [ocr, cap] = await Promise.all([updateWithAddons(publicId, OCR), updateWithAddons(publicId, CAPTION)])
    if (!ocr.ok) console.warn('analyze: OCR failed:', ocr.error)
    if (!cap.ok) console.warn('analyze: captioning failed:', cap.error)
    ocrText = readOcr(ocr.info)
    caption = readCaption(cap.info)
    ocrOk = ocr.ok
    captionOk = cap.ok
  }

  const result: AnalyzeResponse = {
    suggestions: ocrText ? parseFlyer(ocrText) : {},
    altText: caption?.slice(0, 300),
    ocrText: ocrText?.slice(0, 10_000),
    status: { ocr: statusFor(ocrText, ocrOk), caption: statusFor(caption, captionOk) },
  }
  return Response.json(result)
}
