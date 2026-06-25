import type { Client as PrismaClient } from '@prisma/client';
import { ClientType, type ClientDto, type HeadcountBand } from '@crm/contracts';

/** Map a persisted client row to the API read model, deriving `displayName`. */
export function toClientDto(c: PrismaClient): ClientDto {
  const displayName =
    c.type === ClientType.COMPANY
      ? (c.legalName ?? '—')
      : [c.firstName, c.lastName].filter(Boolean).join(' ') || '—';

  return {
    id: c.id,
    type: c.type,
    displayName,
    email: c.email,
    phone: c.phone,
    ownerName: c.ownerName,
    legalName: c.legalName,
    siren: c.siren,
    industry: c.industry,
    headcount: (c.headcount as HeadcountBand | null) ?? null,
    contactName: c.contactName,
    contactRole: c.contactRole,
    contactEmail: c.contactEmail,
    firstName: c.firstName,
    lastName: c.lastName,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}
