// Lesson-booking time helpers. Lessons happen in London: the admin types a
// naive date-time (datetime-local input) that means Europe/London wall-clock
// time, while the server runs in UTC - these helpers convert explicitly so a
// 2pm lesson is 2pm in London whether it's GMT or BST.

const LONDON = 'Europe/London'

function londonOffsetMs(utcMs: number): number {
  const dtf = new Intl.DateTimeFormat('en-GB', {
    timeZone: LONDON,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const parts: Record<string, string> = {}
  for (const p of dtf.formatToParts(new Date(utcMs))) parts[p.type] = p.value
  const asIfUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second)
  )
  return asIfUtc - utcMs
}

/** Parse a datetime-local value ("2026-07-20T14:00") as London wall-clock
 * time and return the UTC instant, or null if malformed. */
export function londonInputToDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value.trim())
  if (!m) return null
  const [y, mo, d, h, mi] = m.slice(1).map(Number)
  const naiveUtc = Date.UTC(y, mo - 1, d, h, mi)
  // The offset at roughly that moment; a second pass settles instants that
  // sit right on a DST switch.
  let utc = naiveUtc - londonOffsetMs(naiveUtc)
  utc = naiveUtc - londonOffsetMs(utc)
  return new Date(utc)
}

/** Render an instant back into a datetime-local value in London time. */
export function dateToLondonInput(iso: string): string {
  const utcMs = new Date(iso).getTime()
  if (!Number.isFinite(utcMs)) return ''
  const local = new Date(utcMs + londonOffsetMs(utcMs))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}T${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`
}

/** "Sunday 20 July 2026, 2:00 pm" - friendly London-time wording for emails
 * and booking cards. */
export function formatLondon(iso: string): string {
  const date = new Date(iso)
  if (!Number.isFinite(date.getTime())) return ''
  return date
    .toLocaleString('en-GB', {
      timeZone: LONDON,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .replace(' at ', ', ')
}

/** Google Calendar "dates" value: start plus a default hour, in UTC. */
export function gcalDates(iso: string, durationMinutes = 60): string {
  const start = new Date(iso)
  const end = new Date(start.getTime() + durationMinutes * 60_000)
  const stamp = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, '')
  return `${stamp(start)}/${stamp(end)}`
}
