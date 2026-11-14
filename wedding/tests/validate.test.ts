import { describe, expect, it } from 'vitest';
import { dedupeKey, validateInvite } from '../shared/validate';
import { statesForZip, zipStateMismatch } from '../shared/zipState';

const mail = { householdName: '  The   Jensen Family ', delivery: 'mail', street1: '1234 Maple Ln', city: 'Springfield', state: 'mo', postalCode: '65804' };

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

  it('requires the address fields only when mailing', () => {
    const r = validateInvite({ householdName: 'A', delivery: 'mail' });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(Object.keys(r.errors).sort()).toEqual(['city', 'postalCode', 'state', 'street1']);
    expect(validateInvite({ householdName: 'A', delivery: 'email', email: 'a@b.co' }).ok).toBe(true);
  });

  it('drops address fields for email-only requests', () => {
    const r = validateInvite({ ...mail, delivery: 'email', email: ' Grandma@Example.COM ' });
    expect(r.ok && r.value).toMatchObject({ email: 'grandma@example.com', street1: null, postalCode: null });
  });

  it('requires both for "both"', () => {
    const r = validateInvite({ householdName: 'A', delivery: 'both', email: 'a@b.co' });
    expect(r.ok).toBe(false);
  });

  it('rejects bad emails, ZIPs, states and receptions', () => {
    const r = validateInvite({ ...mail, delivery: 'both', email: 'nope', postalCode: '1234', state: 'XX', attending: 'mars' });
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
  it('uses the email when there is one, otherwise the address', () => {
    const a = validateInvite({ ...mail, street1: '1234 Maple Ln.' });
    const b = validateInvite({ ...mail, street1: '1234  maple ln', householdName: 'Jensens' });
    if (!a.ok || !b.ok) throw new Error('expected valid');
    expect(dedupeKey(a.value)).toBe(dedupeKey(b.value));
    const c = validateInvite({ ...mail, delivery: 'both', email: 'x@y.com' });
    if (!c.ok) throw new Error('expected valid');
    expect(dedupeKey(c.value)).toBe('email:x@y.com');
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
