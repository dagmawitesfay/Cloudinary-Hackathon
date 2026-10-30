import { badge } from '../lib/ui'
import { categoryLabel } from '../lib/categories'

export function CategoryBadge({ category }: { category: string }) {
  return <span className={badge}>{categoryLabel(category)}</span>
}
