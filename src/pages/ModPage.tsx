import { RequireModerator } from '../components/RequireModerator'
import { ModQueuePage } from './ModQueuePage'

export function ModPage() {
  return (
    <RequireModerator>
      <ModQueuePage />
    </RequireModerator>
  )
}
