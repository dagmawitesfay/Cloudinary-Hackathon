import { createBrowserRouter } from 'react-router'
import { ErrorPage } from './components/ErrorPage'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'

// Everything except Browse loads on demand to keep the first download small.
export const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/submit', lazy: async () => ({ Component: (await import('./pages/SubmitPage')).SubmitPage }) },
      { path: '/listing/:id', lazy: async () => ({ Component: (await import('./pages/ListingPage')).ListingPage }) },
      { path: '/mod/login', lazy: async () => ({ Component: (await import('./pages/LoginPage')).LoginPage }) },
      { path: '/mod', lazy: async () => ({ Component: (await import('./pages/ModPage')).ModPage }) },
      { path: '*', lazy: async () => ({ Component: (await import('./pages/NotFoundPage')).NotFoundPage }) },
    ],
  },
])
