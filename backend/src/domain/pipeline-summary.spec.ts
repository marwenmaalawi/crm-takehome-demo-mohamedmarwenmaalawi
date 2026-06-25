import { describe, expect, it } from '@jest/globals';
import { OpportunityStage, OpportunityStatus } from '@crm/contracts';
import { computePipelineSummary, type PipelineInput } from './pipeline-summary';

const NOW = new Date('2026-06-23T10:00:00+02:00');
const d = (s: string) => new Date(`${s}T00:00:00.000Z`);

const item = (over: Partial<PipelineInput>): PipelineInput => ({
  status: OpportunityStatus.OPEN,
  stage: OpportunityStage.NEW,
  amount: '1000.00',
  expectedCloseDate: d('2026-12-31'),
  stageChangedAt: NOW,
  ...over,
});

describe('computePipelineSummary', () => {
  it('returns a zeroed, null-conversion summary for no data', () => {
    const s = computePipelineSummary([], NOW);
    expect(s.openTotalValue).toBe('0.00');
    expect(s.openCount).toBe(0);
    expect(s.conversionRate).toBeNull();
    expect(s.byStage).toHaveLength(4);
  });

  it('sums only OPEN value and breaks it down by stage without float drift', () => {
    const s = computePipelineSummary(
      [
        item({ amount: '0.10', stage: OpportunityStage.NEW }),
        item({ amount: '0.20', stage: OpportunityStage.NEW }),
        item({ amount: '5000.00', stage: OpportunityStage.PROPOSAL }),
        item({ status: OpportunityStatus.WON, amount: '9999.99' }),
      ],
      NOW,
    );
    expect(s.openTotalValue).toBe('5000.30'); // 0.10 + 0.20 + 5000.00 — no 0.30000000004
    expect(s.openCount).toBe(3);
    expect(s.byStage.find((b) => b.stage === 'NEW')?.value).toBe('0.30');
    expect(s.byStage.find((b) => b.stage === 'PROPOSAL')?.value).toBe('5000.00');
  });

  it('counts overdue and stalled exposure (OPEN only)', () => {
    const s = computePipelineSummary(
      [
        item({ amount: '1000.00', expectedCloseDate: d('2026-06-01') }), // overdue
        item({ amount: '2000.00', stageChangedAt: d('2026-05-01') }), // stalled
        item({ status: OpportunityStatus.WON, expectedCloseDate: d('2020-01-01') }), // closed, ignored
      ],
      NOW,
    );
    expect(s.overdue).toEqual({ count: 1, value: '1000.00' });
    expect(s.stalled).toEqual({ count: 1, value: '2000.00' });
  });

  it('computes conversion rate won/(won+lost)', () => {
    const s = computePipelineSummary(
      [
        item({ status: OpportunityStatus.WON }),
        item({ status: OpportunityStatus.WON }),
        item({ status: OpportunityStatus.WON }),
        item({ status: OpportunityStatus.LOST }),
      ],
      NOW,
    );
    expect(s.conversionRate).toBeCloseTo(0.75);
    expect(s.wonCount).toBe(3);
    expect(s.lostCount).toBe(1);
  });
});
