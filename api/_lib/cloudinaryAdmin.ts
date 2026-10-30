// Minimal signed Admin API client. Basic auth with key:secret, server only.

export interface AnalysisInfo {
  ocr?: { adv_ocr?: { status?: string; data?: { textAnnotations?: { description?: string }[] }[] } }
  detection?: { captioning?: { status?: string; data?: { caption?: string } } }
}

export interface AddonResult {
  ok: boolean
  info?: AnalysisInfo
  error?: string
  /** 404 = the asset doesn't exist; anything else is an add-on or account problem. */
  httpStatus: number
}

function credentials() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME
  const key = process.env.CLOUDINARY_API_KEY
  const secret = process.env.CLOUDINARY_API_SECRET
  if (!cloud || !key || !secret) return null
  return { cloud, auth: Buffer.from(`${key}:${secret}`).toString('base64') }
}

export const isConfigured = () => credentials() !== null

/** Admin API "update resource" call that requests add-on analysis. */
export async function updateWithAddons(
  publicId: string,
  params: Record<string, string>,
): Promise<AddonResult> {
  const creds = credentials()
  if (!creds) return { ok: false, httpStatus: 500, error: 'Cloudinary credentials missing' }

  // The public_id's slashes are part of the path, so encode each segment only.
  const path = publicId.split('/').map(encodeURIComponent).join('/')
  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${creds.cloud}/resources/image/upload/${path}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${creds.auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params),
        signal: AbortSignal.timeout(20_000),
      },
    )
    const body = (await res.json().catch(() => ({}))) as { info?: AnalysisInfo; error?: { message?: string } }
    if (!res.ok) return { ok: false, httpStatus: res.status, error: body.error?.message ?? res.statusText }
    return { ok: true, httpStatus: res.status, info: body.info }
  } catch (err) {
    return { ok: false, httpStatus: 0, error: err instanceof Error ? err.message : 'Network error' }
  }
}
