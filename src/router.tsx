import { createBrowserRouter } from 'react-router'
import { Layout } from './components/Layout'
import { RequireModerator } from './components/RequireModerator'
import { HomePage } from './pages/HomePage'
import { SubmitPage } from './pages/SubmitPage'
import { ListingPage } from './pages/ListingPage'
import { LoginPage } from './pages/LoginPage'
import { ModQueuePage } from './pages/ModQueuePage'
import { NotFoundPage } from './pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/submit', element: <SubmitPage /> },
      { path: '/listing/:id', element: <ListingPage /> },
      { path: '/mod/login', element: <LoginPage /> },
      {
        path: '/mod',
        element: (
          <RequireModerator>
            <ModQueuePage />
          </RequireModerator>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
