import { Injectable } from '@nestjs/common';
import {
  OpportunityStatus,
  ProblemFlag,
  UPCOMING_SIGNATURE_WINDOW_DAYS,
  type PipelineAttention,
  type PipelineBoard,
  type PipelineSummary,
} from '@crm/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { computePipelineSummary, type PipelineInput } from '../domain/pipeline-summary';
import { computePipelineBoard } from '../domain/pipeline-board';
import { parisDateString } from '../domain/date.util';
import { toOpportunityDto } from '../opportunities/opportunity.mapper';

const ATTENTION_LIMIT = 6;

@Injectable()
export class PipelineService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The "pipeline recap" aggregation (DECISIONS.md §4). We fetch the lightweight columns
   * we need and delegate to the pure `computePipelineSummary` so the math stays testable.
   */
  async summary(): Promise<PipelineSummary> {
    const rows = await this.prisma.opportunity.findMany({
      select: {
        status: true,
        stage: true,
        amount: true,
        expectedCloseDate: true,
        stageChangedAt: true,
        lastActivityAt: true,
      },
    });

    const items: PipelineInput[] = rows.map((r) => ({
      status: r.status,
      stage: r.stage,
      amount: r.amount.toFixed(2),
      expectedCloseDate: r.expectedCloseDate,
      stageChangedAt: r.stageChangedAt,
      lastActivityAt: r.lastActivityAt,
    }));

    return computePipelineSummary(items);
  }

  /**
   * The dashboard "attention" feed: the three actionable lists a rep checks first
   * (overdue, stalled, upcoming signatures). Each list is capped server-side.
   */
  async attention(): Promise<PipelineAttention> {
    const now = new Date();
    const rows = await this.prisma.opportunity.findMany({
      where: { status: OpportunityStatus.OPEN },
      include: { client: true },
    });
    const dtos = rows.map((r) => toOpportunityDto(r, now));

    const overdue = dtos
      .filter((o) => o.problem.flags.includes(ProblemFlag.OVERDUE))
      .sort((a, b) => a.expectedCloseDate.localeCompare(b.expectedCloseDate))
      .slice(0, ATTENTION_LIMIT);

    const stalled = dtos
      .filter((o) => o.problem.flags.includes(ProblemFlag.STALLED))
      .sort((a, b) => (b.problem.stalledDays ?? 0) - (a.problem.stalledDays ?? 0))
      .slice(0, ATTENTION_LIMIT);

    const today = parisDateString(now);
    const windowEnd = parisDateString(new Date(now.getTime() + UPCOMING_SIGNATURE_WINDOW_DAYS * 86_400_000));
    const upcomingSignatures = dtos
      .filter(
        (o) =>
          !o.problem.flags.includes(ProblemFlag.OVERDUE) &&
          o.expectedCloseDate >= today &&
          o.expectedCloseDate <= windowEnd,
      )
      .sort((a, b) => a.expectedCloseDate.localeCompare(b.expectedCloseDate))
      .slice(0, ATTENTION_LIMIT);

    return { overdue, stalled, upcomingSignatures };
  }

  /** The pipeline board: OPEN opportunities grouped into one column per stage. */
  async board(): Promise<PipelineBoard> {
    const now = new Date();
    const rows = await this.prisma.opportunity.findMany({
      where: { status: OpportunityStatus.OPEN },
      orderBy: { expectedCloseDate: 'asc' },
      include: { client: true },
    });
    return computePipelineBoard(rows.map((r) => toOpportunityDto(r, now)));
  }
}
