import type { Art as ArtName } from '../config';

/** Drawings live in the SVG sprite in index.html; these just place them. */
export function Spray({ className }: { className: string }) {
  return (
    <svg className={`spray ${className}`} viewBox="0 0 240 220" aria-hidden="true">
      <use href="#spray" />
    </svg>
  );
}

export function Sprig({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 30" aria-hidden="true">
      <use href="#sprig" />
    </svg>
  );
}

export function Picture({ art }: { art: ArtName | 'rose' }) {
  if (art === 'rose') {
    return (
      <svg viewBox="-50 -50 100 100" aria-hidden="true">
        <use href="#rose" x="-50" y="-50" width="100" height="100" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <use href={`#${art}`} />
    </svg>
  );
}
