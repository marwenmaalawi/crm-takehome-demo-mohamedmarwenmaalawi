/**
 * Date-only helpers. The business reasons in calendar days (Europe/Paris), not instants,
 * so that an opportunity never flips "overdue" because of a timezone boundary.
 * See DECISIONS.md §3.
 *
 * @author Mohamed Marwen Maalawi
 */

export const BUSINESS_TIMEZONE = 'Europe/Paris';

/** Calendar day of an instant, in the business timezone, as `YYYY-MM-DD`. */
export function parisDateString(instant: Date): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

/**
 * Calendar day of a Prisma `@db.Date` value, as `YYYY-MM-DD`.
 * Prisma returns date-only columns as a JS Date at UTC midnight, so we read it back in UTC.
 */
export function utcDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Parse `YYYY-MM-DD` into the UTC-midnight epoch ms of that calendar day. */
function dayToUtcMs(dateOnly: string): number {
  const [y, m, d] = dateOnly.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Whole days from `from` to `to` (both `YYYY-MM-DD`). Positive when `to` is later. */
export function daysBetween(from: string, to: string): number {
  const MS_PER_DAY = 86_400_000;
  return Math.round((dayToUtcMs(to) - dayToUtcMs(from)) / MS_PER_DAY);
}
