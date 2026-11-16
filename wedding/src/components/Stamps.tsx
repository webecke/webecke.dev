import { useEffect, useRef } from 'react';
import { RECEPTIONS, SEALING, googleCalendarUrl, type CalendarEvent, type WeddingEvent } from '../config';
import { Picture } from './Art';

/** "Add to calendar" opens a tiny menu: Google, or a file for Apple/Outlook. */
function CalendarMenu({ event }: { event: CalendarEvent }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (e: Event) => {
      const el = ref.current;
      if (!el?.open) return;
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !el.contains(e.target as Node)) el.open = false;
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, []);
  return (
    <details className="cal" ref={ref}>
      <summary>Add to calendar</summary>
      <div className="cal-menu">
        <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">Google Calendar</a>
        <a href={event.icsUrl} download>Apple / Outlook</a>
      </div>
    </details>
  );
}

function Stamp({ event }: { event: WeddingEvent }) {
  return (
    <li className={`event event-${event.id}`}>
      <div className="stamp">
        <div className="stamp-in">
          <span className="stamp-value">{event.stampValue}</span>
          <Picture art={event.art} />
          <h3 className="script">{event.title}</h3>
        </div>
      </div>
      <p className="caps event-when">{event.when}</p>
      <p className="caps event-where">{event.where}</p>
      <p className="event-links">
        <a href={event.mapUrl} target="_blank" rel="noopener noreferrer">Map</a>
        {event.calendar && (
          <>
            <span aria-hidden="true"> · </span>
            <CalendarMenu event={event.calendar} />
          </>
        )}
      </p>
    </li>
  );
}

export function Stamps() {
  return (
    <section className="sheet" aria-labelledby="dates-title">
      <div className="sheet-inner">
        <div className="sheet-title">
          <h2 id="dates-title" className="script">Save the dates</h2>
          <p className="caps">Two celebrations · two states</p>
        </div>
        <ul className="stamps stamps-top">
          <Stamp event={SEALING} />
        </ul>
        <ul className="stamps stamps-row">
          {RECEPTIONS.map((e) => <Stamp key={e.id} event={e} />)}
        </ul>
      </div>
    </section>
  );
}
