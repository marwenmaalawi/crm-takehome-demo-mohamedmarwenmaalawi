import type {
  Activity as PrismaActivity,
  Client as PrismaClient,
  Opportunity as PrismaOpportunity,
} from '@prisma/client';
import type { OpportunityDto, OpportunityWithClientDto } from '@crm/contracts';
import { assessProblem } from '../domain/opportunity-problem';
import { daysBetween, parisDateString } from '../domain/date.util';
import { toClientDto } from '../clients/client.mapper';
import { toActivityDto } from '../activities/activity.mapper';

/** Map an opportunity row to the API read model, computing problem + aging on read. */
export function toOpportunityDto(
  o: PrismaOpportunity & { client?: PrismaClient | null },
  now: Date = new Date(),
): OpportunityDto {
  const today = parisDateString(now);

  return {
    id: o.id,
    title: o.title,
    amount: o.amount.toFixed(2),
    clientName: o.client ? toClientDto(o.client).displayName : null,
    expectedCloseDate: o.expectedCloseDate.toISOString().slice(0, 10),
    stage: o.stage,
    status: o.status,
    ownerName: o.ownerName,
    notes: o.notes,
    nextStep: o.nextStep,
    nextStepDueAt: o.nextStepDueAt ? o.nextStepDueAt.toISOString().slice(0, 10) : null,
    stageChangedAt: o.stageChangedAt.toISOString(),
    lastActivityAt: o.lastActivityAt ? o.lastActivityAt.toISOString() : null,
    daysSinceLastActivity: o.lastActivityAt
      ? daysBetween(parisDateString(o.lastActivityAt), today)
      : null,
    daysInStage: daysBetween(parisDateString(o.stageChangedAt), today),
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    clientId: o.clientId,
    problem: assessProblem(
      {
        status: o.status,
        expectedCloseDate: o.expectedCloseDate,
        stageChangedAt: o.stageChangedAt,
        lastActivityAt: o.lastActivityAt,
      },
      now,
    ),
  };
}

export function toOpportunityWithClientDto(
  o: PrismaOpportunity & { client: PrismaClient; activities: PrismaActivity[] },
  now: Date = new Date(),
): OpportunityWithClientDto {
  return {
    ...toOpportunityDto(o, now),
    client: toClientDto(o.client),
    activities: o.activities.map(toActivityDto),
  };
}
