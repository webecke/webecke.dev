import { describe, expect, it } from 'vitest';
import { dedupeKey, validateInvite } from '../shared/validate';
import { statesForZip, zipStateMismatch } from '../shared/zipState';

const mail = { householdName: '  The   Jensen Family ', street1: '1234 Maple Ln', city: 'Springfield', state: 'mo', postalCode: '65804' };

describe('validateInvite', () => {
  it('accepts a mailing address and normalizes it', () => {
    const r = validateInvite(mail);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.householdName).toBe('The Jensen Family');
    expect(r.value.state).toBe('MO');
    expect(r.value.email).toBeNull();
    expect(r.warnings).toEqual({});
  });

  it('always requires the address', () => {
    const r = validateInvite({ householdName: 'A', email: 'a@b.co' });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(Object.keys(r.errors).sort()).toEqual(['city', 'postalCode', 'state', 'street1']);
  });

  it('records "mail" without an email and "both" with one', () => {
    const plain = validateInvite(mail);
    expect(plain.ok && plain.value.delivery).toBe('mail');
    const withEmail = validateInvite({ ...mail, email: ' Grandma@Example.COM ' });
    expect(withEmail.ok && withEmail.value).toMatchObject({ delivery: 'both', email: 'grandma@example.com', street1: '1234 Maple Ln' });
  });

  it('ignores a stray delivery field from older clients', () => {
    const r = validateInvite({ ...mail, delivery: 'email' });
    expect(r.ok && r.value.delivery).toBe('mail');
  });

  it('rejects bad emails, ZIPs, states and receptions', () => {
    const r = validateInvite({ ...mail, email: 'nope', postalCode: '1234', state: 'XX', attending: 'mars' });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors).toHaveProperty('email');
    expect(r.errors).toHaveProperty('postalCode');
    expect(r.errors).toHaveProperty('state');
    expect(r.errors).toHaveProperty('attending');
  });

  it('formats ZIP+4 and warns (without failing) when the ZIP is from another state', () => {
    const r = validateInvite({ ...mail, postalCode: '840421234', state: 'MO' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.postalCode).toBe('84042-1234');
    expect(r.warnings.postalCode).toMatch(/Utah/);
  });

  it('rejects junk input and over-long fields', () => {
    expect(validateInvite(null).ok).toBe(false);
    expect(validateInvite({ ...mail, householdName: 'x'.repeat(121) }).ok).toBe(false);
    expect(validateInvite({ ...mail, note: 'x'.repeat(501) }).ok).toBe(false);
  });
});

describe('dedupeKey', () => {
  it('keys on the address, so adding an email later is the same household', () => {
    const a = validateInvite({ ...mail, street1: '1234 Maple Ln.' });
    const b = validateInvite({ ...mail, street1: '1234  maple ln', householdName: 'Jensens' });
    if (!a.ok || !b.ok) throw new Error('expected valid');
    expect(dedupeKey(a.value)).toBe(dedupeKey(b.value));
    const c = validateInvite({ ...mail, email: 'x@y.com' });
    if (!c.ok) throw new Error('expected valid');
    expect(dedupeKey(c.value)).toBe(dedupeKey(a.value));
  });
});

describe('zip to state', () => {
  it.each([
    ['84042', 'UT'], ['84129', 'UT'], ['64157', 'MO'], ['65804', 'MO'], ['10001', 'NY'],
    ['02108', 'MA'], ['05501', 'MA'], ['20500', 'DC'], ['73301', 'TX'], ['99501', 'AK'], ['96701', 'HI'],
  ])('%s is in %s', (zip, state) => {
    expect(statesForZip(zip)).toContain(state);
    expect(zipStateMismatch(zip, state)).toBeNull();
  });

  it('reports the likely state on a mismatch', () => {
    expect(zipStateMismatch('84042', 'MO')).toBe('UT');
  });
});
