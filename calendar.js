/* Calendar exports use German venue time, regardless of the device's time zone. */
const TSVCalendar = (() => {
  const title = 'Massage beim TSV';
  const location = 'TSV Überlingen am Ried';
  const description = 'Dein Massage-Termin beim TSV Überlingen am Ried. Bitte sei pünktlich. Änderungen und Absagen bitte auch im eigenen Kalender nachtragen. Termine: https://tsvueberlingen.github.io/';
  function times(slot) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(slot.date) || !/^\d{2}:\d{2}$/.test(slot.time) || !Number.isInteger(slot.duration) || slot.duration < 10 || slot.duration > 120) throw new Error('Ungültiger Termin.');
    const [year, month, day] = slot.date.split('-').map(Number);
    const [hour, minute] = slot.time.split(':').map(Number);
    const start = new Date(Date.UTC(year, month - 1, day, hour, minute));
    const stamp = d => d.toISOString().replace(/[-:]/g, '').slice(0, 15);
    if (start.toISOString().slice(0, 16) !== `${slot.date}T${slot.time}`) throw new Error('Ungültiger Termin.');
    return { start: stamp(start), end: stamp(new Date(start.getTime() + slot.duration * 60000)) };
  }
  const escapeText = value => String(value).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
  // RFC 5545: fold at 75 octets without splitting a UTF-8 character.
  function fold(line) {
    let result = '', bytes = 0;
    for (const character of line) {
      const size = new TextEncoder().encode(character).length;
      if (bytes + size > 75) { result += '\r\n '; bytes = 1; }
      result += character; bytes += size;
    }
    return result;
  }
  function ics(slot, now = new Date()) {
    const { start, end } = times(slot);
    const uid = String(slot.id).replace(/[^a-zA-Z0-9-]/g, '');
    if (!uid) throw new Error('Ungültiger Termin.');
    return [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TSV Ueberlingen am Ried//Massage//DE', 'CALSCALE:GREGORIAN',
      'BEGIN:VTIMEZONE', 'TZID:Europe/Berlin', 'BEGIN:DAYLIGHT', 'DTSTART:19960331T020000',
      'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'TZNAME:CEST', 'END:DAYLIGHT',
      'BEGIN:STANDARD', 'DTSTART:19961027T030000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
      'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'TZNAME:CET', 'END:STANDARD', 'END:VTIMEZONE',
      'BEGIN:VEVENT', `UID:massage-${uid}@tsvueberlingen.github.io`,
      `DTSTAMP:${now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
      `DTSTART;TZID=Europe/Berlin:${start}`, `DTEND;TZID=Europe/Berlin:${end}`,
      `SUMMARY:${escapeText(title)}`, `LOCATION:${escapeText(location)}`, `DESCRIPTION:${escapeText(description)}`,
      'STATUS:CONFIRMED', 'TRANSP:OPAQUE', 'CLASS:PRIVATE',
      'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:Deine TSV-Massage beginnt in einer Stunde.', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR', ''
    ].map(fold).join('\r\n');
  }
  function googleURL(slot) {
    const { start, end } = times(slot);
    const params = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${start}/${end}`, ctz: 'Europe/Berlin', location, details: description });
    return `https://calendar.google.com/calendar/render?${params}`;
  }
  return Object.freeze({ ics, googleURL });
})();
