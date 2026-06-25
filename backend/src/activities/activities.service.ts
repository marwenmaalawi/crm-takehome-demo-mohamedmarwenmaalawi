import { Injectable, NotFoundException } from '@nestjs/common';
import { type ActivityDto, type CreateActivityDto } from '@crm/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { toActivityDto } from './activity.mapper';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForOpportunity(opportunityId: string): Promise<ActivityDto[]> {
    await this.assertOpportunityExists(opportunityId);
    const rows = await this.prisma.activity.findMany({
      where: { opportunityId },
      orderBy: { occurredAt: 'desc' },
    });
    return rows.map(toActivityDto);
  }

  /**
   * Log an activity and refresh the opportunity's `lastActivityAt` denormalized field
   * (which drives the "stalled" rule). Done in a transaction to keep them consistent.
   */
  async createForOpportunity(opportunityId: string, dto: CreateActivityDto): Promise<ActivityDto> {
    await this.assertOpportunityExists(opportunityId);
    const occurredAt = new Date(dto.occurredAt);

    const activity = await this.prisma.$transaction(async (tx) => {
      const created = await tx.activity.create({
        data: {
          opportunityId,
          type: dto.type,
          summary: dto.summary,
          occurredAt,
          authorName: dto.authorName,
        },
      });

      // Only advance lastActivityAt — never move it backwards on a back-dated entry.
      const current = await tx.opportunity.findUniqueOrThrow({
        where: { id: opportunityId },
        select: { lastActivityAt: true },
      });
      if (!current.lastActivityAt || occurredAt > current.lastActivityAt) {
        await tx.opportunity.update({ where: { id: opportunityId }, data: { lastActivityAt: occurredAt } });
      }
      return created;
    });

    return toActivityDto(activity);
  }

  private async assertOpportunityExists(id: string): Promise<void> {
    const found = await this.prisma.opportunity.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Opportunité introuvable');
  }
}
