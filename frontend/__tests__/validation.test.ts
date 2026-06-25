import { describe, it, expect } from 'vitest';
import { createClientSchema, createOpportunitySchema } from '@crm/contracts';

/**
 * The form validation source of truth is the shared Zod schema (used identically by the
 * API). Testing it here protects the create/edit forms from silent contract drift.
 */
describe('opportunity form validation (shared schema)', () => {
  const valid = {
    title: 'Deal',
    clientId: '11111111-1111-1111-1111-111111111111',
    amount: '12000.50',
    expectedCloseDate: '2099-01-01',
    stage: 'NEW',
    ownerName: 'Rep',
  };

  it('accepts a valid payload (and defaults status to OPEN)', () => {
    const r = createOpportunitySchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.status).toBe('OPEN');
  });

  it('rejects a non-positive amount', () => {
    expect(createOpportunitySchema.safeParse({ ...valid, amount: '-5' }).success).toBe(false);
  });

  it('rejects an empty title and a malformed date', () => {
    expect(createOpportunitySchema.safeParse({ ...valid, title: '' }).success).toBe(false);
    expect(createOpportunitySchema.safeParse({ ...valid, expectedCloseDate: '01/01/2099' }).success).toBe(false);
  });
});

describe('client form validation (discriminated union)', () => {
  it('requires legalName for a company', () => {
    expect(createClientSchema.safeParse({ type: 'COMPANY', ownerName: 'Rep' }).success).toBe(false);
    expect(
      createClientSchema.safeParse({ type: 'COMPANY', legalName: 'Acme', ownerName: 'Rep' }).success,
    ).toBe(true);
  });

  it('requires first and last name for an individual', () => {
    expect(createClientSchema.safeParse({ type: 'INDIVIDUAL', firstName: 'Léa', ownerName: 'Rep' }).success).toBe(false);
    expect(
      createClientSchema.safeParse({ type: 'INDIVIDUAL', firstName: 'Léa', lastName: 'F', ownerName: 'Rep' }).success,
    ).toBe(true);
  });
});
