import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router'
import { AdvancedImage } from '@cloudinary/react'
import type { AnalyzeResponse } from '../../shared/analyze'
import { UploadWidget, type CloudinaryUploadResult } from '../cloudinary/UploadWidget'
import { ListingForm } from '../components/ListingForm'
import { ErrorState, Spinner, SuccessAlert } from '../components/states'
import { useTitle } from '../hooks/useTitle'
import { analyzeFlyer } from '../lib/analyze'
import { previewImage } from '../lib/cloudinary'
import { buttonPrimary, buttonSecondary, muted, note, pageTitle, panel } from '../lib/ui'

type Analysis = { state: 'idle' } | { state: 'analyzing' } | { state: 'done'; result: AnalyzeResponse }

const uploadZone =
  'flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border-strong ' +
  'px-6 py-12 text-center transition-colors hover:border-accent hover:bg-accent/5 ' +
  'disabled:cursor-wait disabled:opacity-60'

function CloudIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-12 w-12 text-muted"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 9.5a4 4 0 0 1-.5 8H7Z" />
      <path d="M12 16v-5m0 0-2 2m2-2 2 2" />
    </svg>
  )
}

export function SubmitPage() {
  useTitle('Add a flyer')
  const [upload, setUpload] = useState<CloudinaryUploadResult | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<Analysis>({ state: 'idle' })
  const [submitted, setSubmitted] = useState(false)
  const latestUpload = useRef<string | null>(null)

  const handleUpload = useCallback(async (result: CloudinaryUploadResult) => {
    setUpload(result)
    setUploadError(null)
    setSubmitted(false)
    setAnalysis({ state: 'analyzing' })
    latestUpload.current = result.public_id
    const analyzed = await analyzeFlyer(result.public_id)
    // Ignore a slow result if the user has since uploaded a different photo.
    if (latestUpload.current === result.public_id) setAnalysis({ state: 'done', result: analyzed })
  }, [])

  const handleError = useCallback((err: Error) => setUploadError(err.message), [])

  function startOver() {
    latestUpload.current = null
    setUpload(null)
    setAnalysis({ state: 'idle' })
    setSubmitted(false)
  }

  if (submitted) {
    return (
      <section className="mx-auto max-w-xl">
        <div className={`${panel} text-center`}>
          <h1 className={pageTitle}>Thank you!</h1>
          <div className="mt-6 text-left">
            <SuccessAlert>
              Your listing was submitted. It will appear once it has been reviewed by a moderator.
            </SuccessAlert>
          </div>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" onClick={startOver} className={buttonPrimary}>
              Add another flyer
            </button>
            <Link to="/" className={buttonSecondary}>
              Browse listings
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-xl">
      <h1 className={pageTitle}>Add a flyer</h1>
      <p className={`mt-3 ${muted}`}>Step {upload ? '2 of 2: check the details' : '1 of 2: upload a photo'}</p>

      <div className={`${panel} mt-6`}>
        {!upload && (
          <UploadWidget onUploadSuccess={handleUpload} onUploadError={handleError} className={uploadZone}>
            <CloudIcon />
            <span className="font-bold">Take or upload a photo of a flyer</span>
            <span className={muted}>JPG, PNG, WebP, or HEIC, up to 10 MB</span>
          </UploadWidget>
        )}

        {uploadError && (
          <div className="mt-4">
            <ErrorState message={`Upload failed: ${uploadError}`} />
          </div>
        )}

        {upload && (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-3">
              <AdvancedImage
                cldImg={previewImage(upload.public_id, 560)}
                alt="Your uploaded flyer"
                className="max-h-72 w-auto rounded-xl border border-border"
              />
              <UploadWidget
                onUploadSuccess={handleUpload}
                onUploadError={handleError}
                className={`${buttonSecondary} px-4 py-2 text-sm`}
              >
                Use a different photo
              </UploadWidget>
            </div>

            <div>
              {analysis.state === 'analyzing' && <Spinner label="Reading your flyer…" />}
              {analysis.state === 'done' && (
                <div className="space-y-4">
                  <AnalysisNotes result={analysis.result} />
                  {/* key remounts the form with fresh prefill when a new photo is uploaded */}
                  <ListingForm
                    key={upload.public_id}
                    upload={upload}
                    analysis={analysis.result}
                    onSubmitted={() => setSubmitted(true)}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function AnalysisNotes({ result }: { result: AnalyzeResponse }) {
  const prefilled = result.status.ocr === 'ok'
  return (
    <>
      <p role="status" className={note}>
        {prefilled
          ? 'We filled these in from your flyer. Please check them.'
          : "We couldn't read the flyer automatically. Please fill in the details."}
      </p>
      {result.ocrText && (
        <details className="rounded-xl border border-border px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium">What we read</summary>
          <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-muted">{result.ocrText}</pre>
        </details>
      )}
    </>
  )
}
