import { useId, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { STATES } from '../../shared/states';
import {
  LIMITS, validateInvite, wantsEmail, wantsMail,
  type Attending, type Delivery, type Field, type Messages,
} from '../../shared/validate';
import { useTurnstile } from '../turnstile';
import { Picture, Sprig } from './Art';

interface Values {
  householdName: string;
  email: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  postalCode: string;
}
const EMPTY: Values = { householdName: '', email: '', street1: '', street2: '', city: '', state: '', postalCode: '' };

const DELIVERY_OPTIONS: Array<[Delivery, string]> = [['mail', 'By mail'], ['email', 'By email'], ['both', 'Both']];
const RECEPTION_OPTIONS: Array<[Attending, string, Array<'barn' | 'stake' | 'rose'>]> = [
  ['utah', 'Utah', ['barn']],
  ['missouri', 'Missouri', ['stake']],
  ['both', 'Both', ['barn', 'stake']],
  ['unsure', 'Not sure', ['rose']],
];

type Status = 'editing' | 'sending' | 'sent';

export function InviteSection() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [delivery, setDelivery] = useState<Delivery>('mail');
  const [attending, setAttending] = useState<Attending | null>(null);
  const [errors, setErrors] = useState<Messages>({});
  const [zipWarning, setZipWarning] = useState<string | null>(null);
  const [zipConfirmed, setZipConfirmed] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [status, setStatus] = useState<Status>('editing');
  const [formError, setFormError] = useState<string | null>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const firstField = useRef<HTMLInputElement>(null);
  const turnstile = useTurnstile();
  const uid = useId();

  const payload = () => ({ ...values, delivery, attending });

  const recheck = (next: Values, nextDelivery = delivery) => {
    if (!triedSubmit) return;
    const r = validateInvite({ ...next, delivery: nextDelivery, attending });
    setErrors(r.ok ? {} : r.errors);
  };

  const set = (field: keyof Values) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const next = { ...values, [field]: e.target.value };
    setValues(next);
    if (field === 'postalCode' || field === 'state') { setZipWarning(null); setZipConfirmed(false); }
    recheck(next);
  };

  const chooseDelivery = (d: Delivery) => { setDelivery(d); recheck(values, d); };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTriedSubmit(true);
    setFormError(null);
    const result = validateInvite(payload());
    if (!result.ok) {
      setErrors(result.errors);
      const first = Object.keys(result.errors)[0];
      document.getElementById(`${uid}-${first}`)?.focus();
      return;
    }
    setErrors({});
    const warning = result.warnings.postalCode ?? null;
    if (warning && !zipConfirmed) {
      setZipWarning(warning);
      setZipConfirmed(true); // a second press means "yes, it's right"
      document.getElementById(`${uid}-postalCode`)?.focus();
      return;
    }

    setStatus('sending');
    const token = await turnstile.getToken();
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...payload(), turnstileToken: token ?? '', website: honeypot.current?.value ?? '' }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; fields?: Messages };
      if (!res.ok) {
        turnstile.reset();
        if (data.fields) setErrors(data.fields);
        setFormError(data.error ?? 'Something went wrong sending the form. Please try again.');
        setStatus('editing');
        return;
      }
      setStatus('sent');
    } catch {
      turnstile.reset();
      setFormError('We couldn’t reach the server. Check your connection and try again.');
      setStatus('editing');
    }
  }

  function startOver() {
    setValues(EMPTY);
    setAttending(null);
    setErrors({});
    setZipWarning(null);
    setZipConfirmed(false);
    setTriedSubmit(false);
    setFormError(null);
    turnstile.reset();
    setStatus('editing');
    requestAnimationFrame(() => firstField.current?.focus());
  }

  const showMail = wantsMail(delivery);
  const showEmail = wantsEmail(delivery);
  const stamps = RECEPTION_OPTIONS.find(([v]) => v === attending)?.[2] ?? ['rose'];
  const cityLine = [values.city, [values.state, values.postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', ');

  const field = (name: Field, label: string, input: ReactNode, hint?: string | null) => (
    <div className={`fld fld-${name}`}>
      <label htmlFor={`${uid}-${name}`}>{label}</label>
      {input}
      {errors[name] && <p className="fld-error" id={`${uid}-${name}-msg`}>{errors[name]}</p>}
      {!errors[name] && hint && <p className="fld-warn" id={`${uid}-${name}-msg`}>{hint}</p>}
    </div>
  );
  const aria = (name: Field, hint?: string | null) => ({
    id: `${uid}-${name}`,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] || hint ? `${uid}-${name}-msg` : undefined,
  });

  return (
    <section className="invite" aria-labelledby="invite-title">
      <div className="invite-title">
        <h2 id="invite-title" className="script">Want an invitation?</h2>
        <p>Address your envelope and we’ll send it</p>
      </div>

      <div className="invite-grid">
        <div className="envelope" aria-hidden="true">
          <div className="env-return caps"><span className="script">Sierra &amp; Dallin</span>Pleasant Grove, Utah</div>
          <div className="env-stamps" key={stamps.join('-')}>
            {stamps.map((art) => (
              <div className="env-stamp" key={art}><div><Picture art={art} /></div></div>
            ))}
          </div>
          <div className="env-to">
            <div className="script env-name">{values.householdName || 'Your name here'}</div>
            {showMail ? (
              <>
                <div className="caps">{values.street1 || 'Street address'}</div>
                {values.street2 && <div className="caps">{values.street2}</div>}
                <div className="caps">{cityLine || 'City, State ZIP'}</div>
              </>
            ) : (
              <>
                <div className="caps env-email">{values.email || 'your@email.com'}</div>
                <div className="caps">delivered by email</div>
              </>
            )}
          </div>
          <Sprig className="env-sprig" />
          {status === 'sent' && <div className="env-postmark">Received<br />with love<br />· S &amp; D ·</div>}
        </div>

        {status === 'sent' ? (
          <div className="sent" role="status">
            <p className="script sent-title">You’re on our list!</p>
            <p>Postmarked with love. Your invitation is on its way soon.</p>
            <p>Spot a typo? Just send it again with the fix.</p>
            <button type="button" className="btn ghost" onClick={startOver}>Address another envelope</button>
          </div>
        ) : (
          <form className="invite-form" onSubmit={submit} noValidate>
            <fieldset className="seg">
              <legend>How should we send it?</legend>
              {DELIVERY_OPTIONS.map(([value, label]) => (
                <button key={value} type="button" aria-pressed={delivery === value} onClick={() => chooseDelivery(value)}>
                  {label}
                </button>
              ))}
            </fieldset>

            {field('householdName', 'Name(s) on the envelope',
              <input ref={firstField} {...aria('householdName')} autoComplete="name" maxLength={LIMITS.householdName}
                placeholder="The Jensen Family" value={values.householdName} onChange={set('householdName')} />)}

            {showEmail && field('email', 'Email',
              <input {...aria('email')} type="email" autoComplete="email" inputMode="email" maxLength={LIMITS.email}
                value={values.email} onChange={set('email')} />)}

            {showMail && (
              <>
                {field('street1', 'Street address',
                  <input {...aria('street1')} autoComplete="address-line1" maxLength={LIMITS.street}
                    value={values.street1} onChange={set('street1')} />)}
                {field('street2', 'Apt, suite, unit (optional)',
                  <input {...aria('street2')} autoComplete="address-line2" maxLength={LIMITS.street}
                    value={values.street2} onChange={set('street2')} />)}
                <div className="row3">
                  {field('city', 'City',
                    <input {...aria('city')} autoComplete="address-level2" maxLength={LIMITS.city}
                      value={values.city} onChange={set('city')} />)}
                  {field('state', 'State',
                    <select {...aria('state')} autoComplete="address-level1" value={values.state} onChange={set('state')}>
                      <option value="">—</option>
                      {STATES.map(([code, name]) => <option key={code} value={code}>{code} · {name}</option>)}
                    </select>)}
                  {field('postalCode', 'ZIP',
                    <input {...aria('postalCode', zipWarning)} autoComplete="postal-code" inputMode="numeric" maxLength={10}
                      value={values.postalCode} onChange={set('postalCode')} />, zipWarning)}
                </div>
              </>
            )}

            <fieldset className="chips">
              <legend>Which reception you’ll likely make it to</legend>
              <div className="chip-row">
                {RECEPTION_OPTIONS.map(([value, label, arts]) => (
                  <button key={value} type="button" aria-pressed={attending === value}
                    onClick={() => setAttending(attending === value ? null : value)}>
                    <span className="chip-art">{arts.map((a) => <Picture key={a} art={a} />)}</span>
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="hp" aria-hidden="true">
              <label htmlFor={`${uid}-website`}>Leave this empty</label>
              <input ref={honeypot} id={`${uid}-website`} name="website" tabIndex={-1} autoComplete="off" />
            </div>

            <div ref={turnstile.containerRef} className="turnstile" />

            {formError && <p className="form-error" role="alert">{formError}</p>}

            <button className="btn" type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : zipWarning ? 'The ZIP is right, send it' : 'Send it our way'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
