import { describe, expect, it } from '@jest/globals';
import { OpportunityStage, type OpportunityDto } from '@crm/contracts';
import { computePipelineBoard } from './pipeline-board';

const opp = (stage: OpportunityStage, amount: string): OpportunityDto =>
  ({ stage, amount, status: 'OPEN' } as unknown as OpportunityDto);

describe('computePipelineBoard', () => {
  it('always returns the four stages in display order, even when empty', () => {
    const board = computePipelineBoard([]);
    expect(board.map((c) => c.stage)).toEqual([
      OpportunityStage.NEW,
      OpportunityStage.QUALIFIED,
      OpportunityStage.PROPOSAL,
      OpportunityStage.NEGOTIATION,
    ]);
    expect(board.every((c) => c.count === 0 && c.value === '0.00')).toBe(true);
  });

  it('groups opportunities and totals value per stage without float drift', () => {
    const board = computePipelineBoard([
      opp(OpportunityStage.NEW, '0.10'),
      opp(OpportunityStage.NEW, '0.20'),
      opp(OpportunityStage.PROPOSAL, '5000.00'),
    ]);
    const newCol = board.find((c) => c.stage === OpportunityStage.NEW)!;
    const proposalCol = board.find((c) => c.stage === OpportunityStage.PROPOSAL)!;
    expect(newCol.count).toBe(2);
    expect(newCol.value).toBe('0.30');
    expect(proposalCol.count).toBe(1);
    expect(proposalCol.value).toBe('5000.00');
  });
});
