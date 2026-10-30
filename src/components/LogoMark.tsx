/** Small pixel-grid mark for the wordmark. Decorative, so hidden from screen readers. */
const CELLS: [number, number, boolean][] = [
  [0, 0, false],
  [1, 0, false],
  [2, 0, true], // the one accent cell
  [0, 1, false],
  [2, 1, false],
  [1, 2, false],
  [2, 2, false],
]

export function LogoMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 14 14" className="h-4 w-4 shrink-0" focusable="false">
      {CELLS.map(([x, y, accent]) => (
        <rect key={`${x}${y}`} x={x * 5} y={y * 5} width="4" height="4" className={accent ? 'fill-accent' : 'fill-text'} />
      ))}
    </svg>
  )
}
