/**
 * Invite-request validation, shared by the browser form and the server.
 * Same rules on both sides: the browser gives instant feedback, the server
 * enforces it because the browser can be skipped.
 */
import { STATE_CODES, stateName } from './states';
import { zipStateMismatch } from './zipState';

export const DELIVERIES = ['mail', 'email', 'both'] as const;
export const ATTENDING = ['utah', 'missouri', 'both', 'unsure'] as const;
export type Delivery = (typeof DELIVERIES)[number];
export type Attending = (typeof ATTENDING)[number];

export type Field =
  | 'householdName' | 'delivery' | 'email' | 'street1' | 'street2'
  | 'city' | 'state' | 'postalCode' | 'attending' | 'note';

/** A request that passed validation, trimmed and normalized. */
export interface CleanInvite {
  householdName: string;
  delivery: Delivery;
  email: string | null;
  street1: string | null;
  street2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  attending: Attending | null;
  note: string | null;
}

export type Messages = Partial<Record<Field, string>>;

export type ValidationResult =
  | { ok: true; value: CleanInvite; warnings: Messages }
  | { ok: false; errors: Messages; warnings: Messages };

export const LIMITS = { householdName: 120, email: 254, street: 120, city: 80, note: 500 } as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ZIP_RE = /^(\d{5})(?:-?(\d{4}))?$/;

export const wantsMail = (d: Delivery) => d === 'mail' || d === 'both';
export const wantsEmail = (d: Delivery) => d === 'email' || d === 'both';

/** Trim and collapse inner whitespace; empty becomes null. */
function clean(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.replace(/\s+/g, ' ').trim();
  return s === '' ? null : s;
}

export function validateInvite(raw: unknown): ValidationResult {
  const input = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const errors: Messages = {};
  const warnings: Messages = {};

  const householdName = clean(input.householdName);
  if (!householdName) errors.householdName = 'Please add the name(s) for the envelope.';
  else if (householdName.length > LIMITS.householdName) errors.householdName = `Please keep this under ${LIMITS.householdName} characters.`;

  const delivery = (DELIVERIES as readonly string[]).includes(input.delivery as string)
    ? (input.delivery as Delivery)
    : null;
  if (!delivery) errors.delivery = 'Choose mail, email, or both.';

  let email: string | null = null;
  let street1: string | null = null;
  let street2: string | null = null;
  let city: string | null = null;
  let state: string | null = null;
  let postalCode: string | null = null;

  if (delivery && wantsEmail(delivery)) {
    email = clean(input.email)?.toLowerCase() ?? null;
    if (!email) errors.email = 'Please add your email.';
    else if (email.length > LIMITS.email || !EMAIL_RE.test(email)) errors.email = 'That email doesn’t look quite right.';
  }

  if (delivery && wantsMail(delivery)) {
    street1 = clean(input.street1);
    street2 = clean(input.street2);
    city = clean(input.city);
    state = clean(input.state)?.toUpperCase() ?? null;
    const zip = clean(input.postalCode)?.replace(/\s/g, '') ?? null;

    if (!street1) errors.street1 = 'Please add your street address.';
    else if (street1.length > LIMITS.street) errors.street1 = 'That street address is too long.';
    if (street2 && street2.length > LIMITS.street) errors.street2 = 'That line is too long.';
    if (!city) errors.city = 'Please add your city.';
    else if (city.length > LIMITS.city) errors.city = 'That city name is too long.';
    if (!state) errors.state = 'Please choose your state.';
    else if (!STATE_CODES.has(state)) errors.state = 'Please choose a state from the list.';

    const m = zip ? ZIP_RE.exec(zip) : null;
    if (!zip) errors.postalCode = 'Please add your ZIP code.';
    else if (!m) errors.postalCode = 'ZIP codes are 5 digits, like 84042.';
    else {
      postalCode = m[2] ? `${m[1]}-${m[2]}` : m[1];
      if (state && STATE_CODES.has(state)) {
        const actual = zipStateMismatch(postalCode, state);
        if (actual) warnings.postalCode = `That ZIP usually belongs to ${stateName(actual)}. Mind double-checking?`;
      }
    }
  }

  let attending: Attending | null = null;
  if (input.attending != null && input.attending !== '') {
    if ((ATTENDING as readonly string[]).includes(input.attending as string)) attending = input.attending as Attending;
    else errors.attending = 'Please choose one of the receptions.';
  }

  const note = clean(input.note);
  if (note && note.length > LIMITS.note) errors.note = `Please keep notes under ${LIMITS.note} characters.`;

  if (Object.keys(errors).length > 0 || !householdName || !delivery) return { ok: false, errors, warnings };
  return {
    ok: true,
    warnings,
    value: { householdName, delivery, email, street1, street2, city, state, postalCode, attending, note },
  };
}

/**
 * Which household a submission belongs to, so resubmissions replace earlier
 * ones in the admin view: the email when there is one, otherwise the address.
 */
export function dedupeKey(v: CleanInvite): string {
  if (v.email) return `email:${v.email}`;
  const norm = (s: string | null) => (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return `addr:${norm(v.street1)}|${norm(v.street2)}|${(v.postalCode ?? '').slice(0, 5)}`;
}
