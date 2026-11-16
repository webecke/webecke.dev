import { REGISTRY_URL, THE_KNOT_URL } from '../config';
import { Spray } from './Art';

export function Footer() {
  return (
    <footer className="footer">
      {THE_KNOT_URL && (
        <a className="btn knot" href={THE_KNOT_URL} target="_blank" rel="noopener noreferrer">Find us on The Knot</a>
      )}
      <p className="caps">The couple is registered at</p>
      <a className="script registry" href={REGISTRY_URL} target="_blank" rel="noopener noreferrer">Amazon</a>
      <p className="caps with-love">With love, Sierra &amp; Dallin</p>
      <Spray className="spray-br" />
    </footer>
  );
}
