import { RECEPTIONS, SEALING, type WeddingEvent } from '../config';
import { Picture } from './Art';

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
        {event.calendarUrl && (
          <>
            <span aria-hidden="true"> · </span>
            <a href={event.calendarUrl} download>Add to calendar</a>
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
