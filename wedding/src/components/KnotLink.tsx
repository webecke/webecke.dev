import { THE_KNOT_URL } from '../config';

export function KnotLink() {
  if (!THE_KNOT_URL) return null;
  return (
    <section className="details" aria-labelledby="details-title">
      <h2 id="details-title" className="script">Details &amp; RSVP</h2>
      <p>Everything else, plus RSVPs, lives on our wedding website.</p>
      <a className="btn" href={THE_KNOT_URL} target="_blank" rel="noopener noreferrer">Visit our wedding website</a>
    </section>
  );
}
