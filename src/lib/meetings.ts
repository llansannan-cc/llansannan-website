// Time-dependent meeting logic, shared by the homepage banner, the meetings
// table and the calendar. Nothing here relies on a hand-edited "status" flag:
// a meeting is "past" once it has finished (start time + 3 hours, UK time),
// the first meeting that has not finished is "next", and the rest are
// "upcoming". The same rule is re-run in the visitor's browser (see
// public/assets/js/main.js and the calendar page) so pages stay correct even
// between the daily rebuilds.

export function londonNow(): { iso: string; stamp: string } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(new Date());
  const g = (t: string) => parts.find(p => p.type === t)!.value;
  const iso = `${g('year')}-${g('month')}-${g('day')}`;
  return { iso, stamp: `${iso}T${g('hour')}:${g('minute')}` };
}

const pad = (n: number) => String(n).padStart(2, '0');

// "YYYY-MM-DDTHH:MM" for when a meeting is treated as over.
export function meetingEndStamp(date: string, time: string, hours = 3): string {
  const [h, m] = (time || '19:00').split(':').map(Number);
  return h + hours > 23 ? `${date}T23:59` : `${date}T${pad(h + hours)}:${pad(m || 0)}`;
}

export function computeStatuses<T extends { date: string; time: string }>(schedule: T[]) {
  const now = londonNow().stamp;
  let nextFound = false;
  return [...schedule]
    .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')))
    .map(m => {
      const end = meetingEndStamp(m.date, m.time);
      let status: 'past' | 'next' | 'upcoming';
      if (end < now) status = 'past';
      else if (!nextFound) { status = 'next'; nextFound = true; }
      else status = 'upcoming';
      return { ...m, end, status };
    });
}
