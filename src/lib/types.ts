export type ListingStatus = 'pending' | 'approved' | 'rejected'

export interface Listing {
  id: string
  created_at: string
  status: ListingStatus
  title: string
  description: string | null
  category: string
  event_date: string | null
  location_text: string | null
  contact: string | null
  image_public_id: string
  image_width: number | null
  image_height: number | null
  image_alt: string
  ocr_raw_text: string | null
  tags: string[]
}

export type NewListing = Omit<Listing, 'id' | 'created_at' | 'status'>
