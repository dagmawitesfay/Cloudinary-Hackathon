import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router'
import { AdvancedImage } from '@cloudinary/react'
import type { AnalyzeResponse } from '../../shared/analyze'
import { UploadWidget, type CloudinaryUploadResult } from '../cloudinary/UploadWidget'
import { ListingForm } from '../components/ListingForm'
import { ErrorState, Spinner } from '../components/states'
import { analyzeFlyer } from '../lib/analyze'
import { previewImage } from '../lib/cloudinary'

type Analysis = { state: 'idle' } | { state: 'analyzing' } | { state: 'done'; result: AnalyzeResponse }

export function SubmitPage() {
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
      <section className="mx-auto max-w-2xl text-center" aria-live="polite">
        <h1 className="text-2xl font-bold">Thank you!</h1>
        <p className="mt-3 text-stone-700">
          Your listing was submitted. It will appear once it has been reviewed by a moderator.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={startOver}
            className="rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Add another flyer
          </button>
          <Link
            to="/"
            className="rounded-lg border border-stone-300 px-5 py-3 font-medium hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Browse listings
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">Add a flyer</h1>
      <p className="mt-2 text-stone-600">
        Take or upload a photo of a paper flyer. We'll read it and fill in what we can. You can edit everything before
        submitting.
      </p>

      <div className="mt-6">
        <UploadWidget
          buttonText={upload ? 'Use a different photo' : 'Upload a flyer photo'}
          onUploadSuccess={handleUpload}
          onUploadError={handleError}
        />
        <p className="mt-2 text-sm text-stone-500">JPG, PNG, WebP, or HEIC, up to 10 MB.</p>
      </div>

      {uploadError && (
        <div className="mt-4">
          <ErrorState message={`Upload failed: ${uploadError}`} />
        </div>
      )}

      {upload && (
        <div className="mt-8 grid gap-8 md:grid-cols-[240px_1fr]">
          <div>
            <AdvancedImage
              cldImg={previewImage(upload.public_id, 480)}
              alt="Your uploaded flyer"
              className="w-full rounded-lg border border-stone-200"
            />
          </div>

          <div aria-live="polite">
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
    </section>
  )
}

function AnalysisNotes({ result }: { result: AnalyzeResponse }) {
  const prefilled = result.status.ocr === 'ok'
  return (
    <>
      <p className={`rounded-lg px-4 py-3 ${prefilled ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'}`}>
        {prefilled
          ? 'We filled in what we could read. Please check each field.'
          : "We couldn't read the flyer automatically. Please fill in the details."}
      </p>
      {result.ocrText && (
        <details className="rounded-lg border border-stone-200 p-3">
          <summary className="cursor-pointer text-sm font-medium">What we read</summary>
          <pre className="mt-2 text-sm whitespace-pre-wrap text-stone-700">{result.ocrText}</pre>
        </details>
      )}
    </>
  )
}
