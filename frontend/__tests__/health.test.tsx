import { describe, it, expect } from 'vitest';
import type { OpportunityDto } from '@crm/contracts';
import { deriveHealth } from '@/components/HealthBadge';

const opp = (status: string, isProblem: boolean): OpportunityDto =>
  ({ status, problem: { isProblem } } as unknown as OpportunityDto);

describe('deriveHealth', () => {
  it('is inactive when there are no open opportunities', () => {
    expect(deriveHealth([])).toBe('inactive');
    expect(deriveHealth([opp('WON', false)])).toBe('inactive');
  });

  it('is healthy when open opportunities exist and none are problematic', () => {
    expect(deriveHealth([opp('OPEN', false), opp('WON', false)])).toBe('healthy');
  });

  it('is at risk when any open opportunity is problematic', () => {
    expect(deriveHealth([opp('OPEN', false), opp('OPEN', true)])).toBe('atRisk');
  });
});
