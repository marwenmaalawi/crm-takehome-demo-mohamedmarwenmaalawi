import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  OpportunityStatus,
  STALLED_THRESHOLD_DAYS,
  type CreateOpportunityDto,
  type ListOpportunitiesQuery,
  type OpportunityDto,
  type OpportunityWithClientDto,
  type Paginated,
  type UpdateOpportunityDto,
} from '@crm/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { parisDateString } from '../domain/date.util';
import { toOpportunityDto, toOpportunityWithClientDto } from './opportunity.mapper';

@Injectable()
export class OpportunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOpportunityDto): Promise<OpportunityDto> {
    const created = await this.prisma.opportunity.create({
      data: {
        title: dto.title,
        clientId: dto.clientId,
        amount: new Prisma.Decimal(dto.amount),
        expectedCloseDate: this.toDbDate(dto.expectedCloseDate),
        stage: dto.stage,
        status: dto.status,
        ownerName: dto.ownerName,
        notes: dto.notes ?? null,
        nextStep: dto.nextStep ?? null,
        nextStepDueAt: dto.nextStepDueAt ? this.toDbDate(dto.nextStepDueAt) : null,
        stageChangedAt: new Date(),
      },
    });
    return toOpportunityDto(created);
  }

  async findOne(id: string): Promise<OpportunityWithClientDto> {
    const row = await this.prisma.opportunity.findUnique({
      where: { id },
      include: { client: true, activities: { orderBy: { occurredAt: 'desc' } } },
    });
    if (!row) throw new NotFoundException('Opportunité introuvable');
    return toOpportunityWithClientDto(row);
  }

  async update(id: string, dto: UpdateOpportunityDto): Promise<OpportunityDto> {
    const current = await this.prisma.opportunity.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Opportunité introuvable');

    // Reset the stalled clock only when the stage genuinely moves (DECISIONS.md §3).
    const stageMoved = dto.stage !== undefined && dto.stage !== current.stage;

    const updated = await this.prisma.opportunity.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.clientId !== undefined && { clientId: dto.clientId }),
        ...(dto.amount !== undefined && { amount: new Prisma.Decimal(dto.amount) }),
        ...(dto.expectedCloseDate !== undefined && {
          expectedCloseDate: this.toDbDate(dto.expectedCloseDate),
        }),
        ...(dto.stage !== undefined && { stage: dto.stage }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.ownerName !== undefined && { ownerName: dto.ownerName }),
        ...(dto.notes !== undefined && { notes: dto.notes ?? null }),
        ...(dto.nextStep !== undefined && { nextStep: dto.nextStep ?? null }),
        ...(dto.nextStepDueAt !== undefined && {
          nextStepDueAt: dto.nextStepDueAt ? this.toDbDate(dto.nextStepDueAt) : null,
        }),
        ...(stageMoved && { stageChangedAt: new Date() }),
      },
    });
    return toOpportunityDto(updated);
  }

  async remove(id: string): Promise<void> {
    // throws P2025 → 404 via the global filter when the row does not exist.
    await this.prisma.opportunity.delete({ where: { id } });
  }

  async list(query: ListOpportunitiesQuery): Promise<Paginated<OpportunityDto>> {
    const where = this.buildWhere(query);
    const skip = (query.page - 1) * query.pageSize;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.opportunity.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortDir },
        skip,
        take: query.pageSize,
        include: { client: true },
      }),
      this.prisma.opportunity.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
    return {
      data: rows.map((r) => toOpportunityDto(r)),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages,
        hasNext: query.page < totalPages,
        hasPrev: query.page > 1,
      },
    };
  }

  /** Translate the query DTO into a Prisma filter, including the derived "problem" filter. */
  private buildWhere(q: ListOpportunitiesQuery): Prisma.OpportunityWhereInput {
    const and: Prisma.OpportunityWhereInput[] = [];

    if (q.stage) and.push({ stage: q.stage });
    if (q.status) and.push({ status: q.status });
    if (q.clientType) and.push({ client: { type: q.clientType } });
    if (q.clientId) and.push({ clientId: q.clientId });

    if (q.search) {
      const contains = { contains: q.search, mode: 'insensitive' as const };
      and.push({
        OR: [
          { title: contains },
          { client: { legalName: contains } },
          { client: { firstName: contains } },
          { client: { lastName: contains } },
        ],
      });
    }

    if (q.problemOnly) {
      and.push(this.problemWhere());
    }

    return and.length ? { AND: and } : {};
  }

  /** OPEN and (overdue OR stalled). Kept consistent with `assessProblem`. */
  private problemWhere(): Prisma.OpportunityWhereInput {
    const todayUtcMidnight = this.toDbDate(parisDateString(new Date()));
    const stalledCutoff = new Date(Date.now() - STALLED_THRESHOLD_DAYS * 86_400_000);
    return {
      status: OpportunityStatus.OPEN,
      OR: [
        // Overdue
        { expectedCloseDate: { lt: todayUtcMidnight } },
        // Stalled with a known last activity (a null lastActivityAt is excluded by `lte`)
        { lastActivityAt: { lte: stalledCutoff } },
        // Stalled with no activity yet → fall back to the last stage change
        { AND: [{ lastActivityAt: null }, { stageChangedAt: { lte: stalledCutoff } }] },
      ],
    };
  }

  /** Store a `YYYY-MM-DD` business date as UTC midnight, matching how `@db.Date` round-trips. */
  private toDbDate(dateOnly: string): Date {
    return new Date(`${dateOnly}T00:00:00.000Z`);
  }
}
