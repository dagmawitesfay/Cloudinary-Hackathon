import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { buttonPrimary } from '../lib/ui'
import { ConfigBanner } from './ConfigBanner'

const navLink = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-1 py-1 text-sm font-medium underline-offset-8 transition-colors hover:text-muted ${
    isActive ? 'underline decoration-2' : ''
  }`

export function Layout() {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const firstRender = useRef(true)

  // After client-side navigation, move focus to the new page so keyboard and
  // screen-reader users start at the top of it (the browser does this on real page loads).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    mainRef.current?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
          <Link to="/" className="rounded-md font-display text-3xl leading-none tracking-wide">
            Flyer Directory
          </Link>
          <nav aria-label="Main" className="flex items-center gap-5">
            <NavLink to="/" end className={navLink}>
              Browse
            </NavLink>
            <NavLink to="/mod" className={navLink}>
              Moderate
            </NavLink>
            <Link to="/submit" className={`${buttonPrimary} px-5 py-2 text-sm`}>
              Add a flyer
            </Link>
          </nav>
        </div>
      </header>
      <ConfigBanner />
      <main id="main" ref={mainRef} tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 outline-none">
        <Outlet />
      </main>
      <footer className="border-t border-border py-6 text-center text-sm text-muted">
        Snap a flyer, and it becomes a listing anyone in the community can find.
      </footer>
    </div>
  )
}
