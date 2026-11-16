import { WEDDING_DATE } from '../config';
import { countdownText } from '../countdown';
import { Spray } from './Art';

export function Hero() {
  return (
    <header className="hero">
      <Spray className="spray-tl" />
      <svg className="hero-wave" viewBox="0 0 70 30" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M0 6 Q9 1 18 6 T36 6 T54 6 T72 6" />
          <path d="M0 15 Q9 10 18 15 T36 15 T54 15 T72 15" />
          <path d="M0 24 Q9 19 18 24 T36 24 T54 24 T72 24" />
        </g>
      </svg>
      <div className="hero-postmark" aria-hidden="true"><span className="city">Taylorsville</span>Utah<br />Jan 16 · 2027</div>
      <div className="hero-inner">
        <p className="caps kicker">Welcome<br />to the wedding of</p>
        <h1 className="script names">
          Sierra<span className="amp">&amp;</span>Dallin
        </h1>
        <p className="caps date">January 16, 2027</p>
        <p className="countdown">{countdownText(WEDDING_DATE)}</p>
      </div>
    </header>
  );
}
