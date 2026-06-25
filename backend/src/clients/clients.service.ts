import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ClientType,
  type CreateClientDto,
  type ClientDto,
  type ListClientsQuery,
  type UpdateClientDto,
} from '@crm/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { toClientDto } from './client.mapper';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClientDto): Promise<ClientDto> {
    // The discriminated DTO guarantees only the right fields are present per type;
    // we spread them into the single-table model (DECISIONS.md §1).
    const data =
      dto.type === ClientType.COMPANY
        ? {
            type: ClientType.COMPANY,
            legalName: dto.legalName,
            siren: dto.siren ?? null,
            industry: dto.industry ?? null,
            headcount: dto.headcount ?? null,
            contactName: dto.contactName ?? null,
            contactRole: dto.contactRole ?? null,
            contactEmail: dto.contactEmail ?? null,
            email: dto.email ?? null,
            phone: dto.phone ?? null,
            ownerName: dto.ownerName,
          }
        : {
            type: ClientType.INDIVIDUAL,
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email ?? null,
            phone: dto.phone ?? null,
            ownerName: dto.ownerName,
          };

    const created = await this.prisma.client.create({ data });
    return toClientDto(created);
  }

  async findAll(query: ListClientsQuery = {}): Promise<ClientDto[]> {
    const where: Prisma.ClientWhereInput = {};
    if (query.type) where.type = query.type;
    if (query.search) {
      const contains = { contains: query.search, mode: 'insensitive' as const };
      where.OR = [
        { legalName: contains },
        { firstName: contains },
        { lastName: contains },
        { email: contains },
      ];
    }
    const rows = await this.prisma.client.findMany({ where, orderBy: { createdAt: 'desc' } });
    return rows.map(toClientDto);
  }

  async findOne(id: string): Promise<ClientDto> {
    const row = await this.prisma.client.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Client introuvable');
    return toClientDto(row);
  }

  async update(id: string, dto: UpdateClientDto): Promise<ClientDto> {
    const current = await this.prisma.client.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Client introuvable');

    const updated = await this.prisma.client.update({
      where: { id },
      data: {
        ...(dto.email !== undefined && { email: dto.email ?? null }),
        ...(dto.phone !== undefined && { phone: dto.phone ?? null }),
        ...(dto.ownerName !== undefined && { ownerName: dto.ownerName }),
        ...(dto.legalName !== undefined && { legalName: dto.legalName }),
        ...(dto.siren !== undefined && { siren: dto.siren ?? null }),
        ...(dto.industry !== undefined && { industry: dto.industry ?? null }),
        ...(dto.headcount !== undefined && { headcount: dto.headcount ?? null }),
        ...(dto.contactName !== undefined && { contactName: dto.contactName ?? null }),
        ...(dto.contactRole !== undefined && { contactRole: dto.contactRole ?? null }),
        ...(dto.contactEmail !== undefined && { contactEmail: dto.contactEmail ?? null }),
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
      },
    });
    return toClientDto(updated);
  }

  async remove(id: string): Promise<void> {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { _count: { select: { opportunities: true } } },
    });
    if (!client) throw new NotFoundException('Client introuvable');

    // Don't orphan opportunities — refuse deletion while the client still has any.
    if (client._count.opportunities > 0) {
      throw new ConflictException(
        `Impossible de supprimer : ce client a ${client._count.opportunities} opportunité(s) rattachée(s)`,
      );
    }
    await this.prisma.client.delete({ where: { id } });
  }
}
