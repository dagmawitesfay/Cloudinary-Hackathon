import { useEffect } from 'react'

const SITE = 'Flyer Directory'

/** Sets the tab/screen-reader page title (a single-page app doesn't do this itself). */
export function useTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE}` : `${SITE}: community flyers, searchable`
  }, [title])
}
