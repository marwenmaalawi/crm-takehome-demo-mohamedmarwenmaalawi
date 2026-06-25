import { describe, it, expect } from 'vitest';
import { OpportunityStatus, ProblemFlag } from '@crm/contracts';
import { assessProblem } from './opportunity-problem';

/** Fixed "now": 2026-06-23 (a Tuesday), Europe/Paris. */
const NOW = new Date('2026-06-23T10:00:00+02:00');
const d = (s: string) => new Date(`${s}T00:00:00.000Z`); // mimics Prisma @db.Date

describe('assessProblem', () => {
  it('flags nothing for a closed (WON) opportunity even if the date is past', () => {
    const r = assessProblem(
      {
        status: OpportunityStatus.WON,
        expectedCloseDate: d('2020-01-01'),
        stageChangedAt: d('2020-01-01'),
      },
      NOW,
    );
    expect(r.isProblem).toBe(false);
    expect(r.flags).toEqual([]);
  });

  it('flags OVERDUE when expected close date is in the past', () => {
    const r = assessProblem(
      { status: OpportunityStatus.OPEN, expectedCloseDate: d('2026-06-11'), stageChangedAt: NOW },
      NOW,
    );
    expect(r.flags).toContain(ProblemFlag.OVERDUE);
    expect(r.overdueDays).toBe(12);
    expect(r.reasons).toContain('En retard de 12 j');
  });

  it('does NOT flag OVERDUE on the due date itself (boundary)', () => {
    const r = assessProblem(
      { status: OpportunityStatus.OPEN, expectedCloseDate: d('2026-06-23'), stageChangedAt: NOW },
      NOW,
    );
    expect(r.flags).not.toContain(ProblemFlag.OVERDUE);
    expect(r.overdueDays).toBeNull();
  });

  it('flags STALLED at exactly the 14-day threshold', () => {
    const r = assessProblem(
      {
        status: OpportunityStatus.OPEN,
        expectedCloseDate: d('2026-12-31'),
        stageChangedAt: d('2026-06-09'),
      },
      NOW,
    );
    expect(r.flags).toContain(ProblemFlag.STALLED);
    expect(r.stalledDays).toBe(14);
  });

  it('does NOT flag STALLED at 13 days (just under threshold)', () => {
    const r = assessProblem(
      {
        status: OpportunityStatus.OPEN,
        expectedCloseDate: d('2026-12-31'),
        stageChangedAt: d('2026-06-10'),
      },
      NOW,
    );
    expect(r.flags).not.toContain(ProblemFlag.STALLED);
    expect(r.stalledDays).toBeNull();
  });

  it('uses lastActivityAt (not stageChangedAt) when an activity exists', () => {
    // Stage moved long ago, but a recent activity keeps the deal alive → not stalled.
    const r = assessProblem(
      {
        status: OpportunityStatus.OPEN,
        expectedCloseDate: d('2026-12-31'),
        stageChangedAt: d('2026-01-01'),
        lastActivityAt: d('2026-06-20'),
      },
      NOW,
    );
    expect(r.flags).not.toContain(ProblemFlag.STALLED);
  });

  it('flags STALLED when the last activity is older than the threshold', () => {
    const r = assessProblem(
      {
        status: OpportunityStatus.OPEN,
        expectedCloseDate: d('2026-12-31'),
        stageChangedAt: d('2026-06-22'),
        lastActivityAt: d('2026-06-01'),
      },
      NOW,
    );
    expect(r.flags).toContain(ProblemFlag.STALLED);
    expect(r.stalledDays).toBe(22);
  });

  it('can carry both flags at once', () => {
    const r = assessProblem(
      {
        status: OpportunityStatus.OPEN,
        expectedCloseDate: d('2026-06-01'),
        stageChangedAt: d('2026-05-01'),
      },
      NOW,
    );
    expect(r.flags).toEqual(expect.arrayContaining([ProblemFlag.OVERDUE, ProblemFlag.STALLED]));
    expect(r.isProblem).toBe(true);
    expect(r.reasons).toHaveLength(2);
  });
});
