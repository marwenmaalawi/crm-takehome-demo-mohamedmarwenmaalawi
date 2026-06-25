import type { Activity as PrismaActivity } from '@prisma/client';
import type { ActivityDto } from '@crm/contracts';

export function toActivityDto(a: PrismaActivity): ActivityDto {
  return {
    id: a.id,
    type: a.type,
    summary: a.summary,
    occurredAt: a.occurredAt.toISOString(),
    authorName: a.authorName,
    opportunityId: a.opportunityId,
    createdAt: a.createdAt.toISOString(),
  };
}
