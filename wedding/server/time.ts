/** Submission times are stored in UTC; the admin page and CSV show them in Mountain time. */
const ZONE = 'America/Denver';

const friendly = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONE, month: 'short', day: 'numeric', year: 'numeric',
  hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
});

const sortable = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'short',
});

function parse(iso: string): Date | null {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "Nov 15, 2026, 8:30 PM MST" (MDT in summer). */
export function mountainFriendly(iso: string): string {
  const d = parse(iso);
  return d ? friendly.format(d) : iso;
}

/** "2026-11-15 20:30 MST": sorts correctly as text in a spreadsheet. */
export function mountainSortable(iso: string): string {
  const d = parse(iso);
  if (!d) return iso;
  const p = Object.fromEntries(sortable.formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute} ${p.timeZoneName}`;
}
