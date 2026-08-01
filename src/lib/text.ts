/**
 * Search over a list that mixes Hebrew and English: strip niqqud, the various
 * apostrophes and quote marks Hebrew titles are written with, and case.
 */
export function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[֑-ׇ]/g, '')
    .replace(/[̀-ͯ]/g, '')
    .replace(/["'`´’‘“”״׳]/g, '')
    .replace(/[-–—_.,!?()[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Every query word must appear somewhere, in any order. */
export function matches(query: string, ...fields: string[]): boolean {
  const q = normalize(query)
  if (!q) return true
  const hay = normalize(fields.join(' '))
  return q.split(' ').every((word) => hay.includes(word))
}

export function isHebrew(value: string): boolean {
  return /[֐-׿]/.test(value)
}

/** First letter for the A-Z / א-ת index in the full list. */
export function initial(value: string): string {
  const first = normalize(value).charAt(0).toUpperCase()
  if (!first) return '#'
  return /[א-תA-Z]/.test(first) ? first : '#'
}
