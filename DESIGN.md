# DESIGN.md — Visual design system

Every page and component follows this file. If something isn't covered here, choose the option that best fits the tone below, and keep it consistent with existing components.

## Tone
Civic, grounded, community-owned. Not corporate, not startup-polished. Built for the neighborhood, not to sell something to it. Plain words, honest labels, no marketing fluff.

## Color tokens (one accent only: coral orange)
- bg: #0e0f11 (page background)
- surface: #1a1c20 (cards, modals, inputs)
- border: rgba(255,255,255,0.08) (card/input borders, dividers)
- accent: #ff6b35 (primary CTA, active filter pill, focus rings, hover glow)
- accent-hover: #ff8355
- text: #f0f0f0 (primary text)
- muted: #6b7280 (metadata, placeholders only)
- danger: #f87171 (errors only); success: #4ade80 (success only)
Rules: use the accent sparingly (one primary CTA per view, active filter, focus, hover glow); never for body text or large fills. Body text must meet WCAG AA contrast. Define tokens as CSS variables in src/index.css and map them in the Tailwind theme (bg-surface, text-muted, border-border, bg-accent).

## Typography
- Display headings: Bebas Neue (fallback Barlow Condensed, Impact, sans-serif) for page titles, hero, section headings only.
- Body/UI: Inter (fallback system-ui).
- Load from Google Fonts with display=swap.
- Scale: hero text-6xl to text-8xl desktop / text-5xl mobile, tight leading; page title text-5xl; section text-3xl; body text-base; metadata text-sm muted.

## Texture
Subtle grain overlay on the background: fixed full-screen pseudo-element with inline SVG noise at 4–6% opacity, pointer-events none. Must not hurt contrast or scrolling. No animated grain.

## Components
- Navbar: app name left (display font), pill CTA "Add a flyer" right (bg-accent, dark text). Other links in text color, muted hover. Sticky, slightly transparent bg with backdrop blur, bottom border.
- Buttons: primary = pill/rounded, bg-accent, #0e0f11 text, bold, hover accent-hover. Secondary = transparent with border stroke. Visible accent focus ring on every interactive element.
- Filter pills: rounded-full, border stroke, surface fill, text-sm. Active = accent fill with dark text, aria-pressed.
- Cards: surface fill, 1px border, rounded-xl, no heavy shadows. Image on top (Cloudinary card transformation), then category badge + date (muted), then title. Hover/focus: scale-[1.02], accent border at low opacity plus soft accent glow, ~150ms; no scale with prefers-reduced-motion.
- Badges: small pill, text-xs uppercase with tracking, border stroke, translucent bg. Never accent-filled.
- Inputs: surface fill, border stroke, rounded-lg, muted placeholder, visible labels above fields. Focus = accent border + ring. Errors = danger border and message below.
- Upload zone: 2px dashed border, large rounded area, cloud icon, short instructions, accepted formats in muted. Drag-over = accent dashed border + faint accent tint.
- Modal: centered surface panel, rounded-2xl, border, max ~560px. Backdrop bg at ~70% with blur. Focus trapped, Esc closes, focus returns to trigger.
- Alerts: danger or success border and text on surface.

## Pages
- Home/Browse: big display hero headline (e.g. "Find what's happening in your neighborhood.") + one-line muted subheading. Filter pills (All + listing categories) below. Grid 3 cols desktop / 2 tablet / 1 mobile, gap-6, lazy images. Friendly empty state with CTA.
- Add a flyer: centered modal-style panel (can stay on /submit). Step 1 upload zone, step 2 editable pre-filled form with image preview, full-width primary submit. Honest AI note: "We filled these in from your flyer. Please check them."
- Listing detail: large image, display-font title, metadata row, description, share button.
- Moderation: same cards with Approve (primary) and Reject (secondary).

## Don'ts
No second accent, gradients, or glossy effects. No heavy shadows or neumorphism. No stock-photo heroes or corporate copy. Don't copy any other brand's logos, illustrations, or artwork.

## Browse hero (refinement)
The Browse hero departs from the rules above on purpose: headline in Barlow Condensed ExtraBold (stacked, line-height ~0.86, tight tracking) with the final period in the accent; a small pixel-font (Silkscreen) uppercase eyebrow with an accent square; compact filter chips (text-xs); a small pixel-grid mark before the wordmark; and one soft accent radial glow (max 8% opacity, top-right, behind the hero only). Everything else, including other pages' headings, stays as specified.
