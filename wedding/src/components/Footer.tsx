import { REGISTRY_URL } from '../config';
import { Spray } from './Art';

export function Footer() {
  return (
    <footer className="footer">
      <p className="caps">The couple is registered at</p>
      <a className="script registry" href={REGISTRY_URL} target="_blank" rel="noopener noreferrer">Amazon</a>
      <p className="caps with-love">With love, Sierra &amp; Dallin</p>
      <Spray className="spray-br" />
    </footer>
  );
}
