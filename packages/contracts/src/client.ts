import { z } from 'zod';
import { ClientType, clientTypeSchema } from './enums';

/**
 * Client contracts — discriminated union on `type` so a COMPANY and an
 * INDIVIDUAL each carry exactly the right fields (see DECISIONS.md §1).
 */

const HEADCOUNT_BANDS = ['1-10', '11-50', '51-200', '201-500', '500+'] as const;
export const headcountBandSchema = z.enum(HEADCOUNT_BANDS);
export type HeadcountBand = z.infer<typeof headcountBandSchema>;

/** Fields common to both client types. */
const clientCommon = {
  email: z.string().trim().email().max(180).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  ownerName: z.string().trim().min(1).max(120),
};

export const createCompanyClientSchema = z.object({
  type: z.literal(ClientType.COMPANY),
  legalName: z.string().trim().min(1, 'Raison sociale requise').max(180),
  siren: z
    .string()
    .trim()
    .regex(/^\d{9}$/, 'Le SIREN doit comporter 9 chiffres')
    .optional()
    .nullable(),
  industry: z.string().trim().max(120).optional().nullable(),
  headcount: headcountBandSchema.optional().nullable(),
  // Primary contact (B2B)
  contactName: z.string().trim().max(120).optional().nullable(),
  contactRole: z.string().trim().max(120).optional().nullable(),
  contactEmail: z.string().trim().email().max(180).optional().nullable(),
  ...clientCommon,
});

export const createIndividualClientSchema = z.object({
  type: z.literal(ClientType.INDIVIDUAL),
  firstName: z.string().trim().min(1, 'Prénom requis').max(80),
  lastName: z.string().trim().min(1, 'Nom requis').max(80),
  ...clientCommon,
});

export const createClientSchema = z.discriminatedUnion('type', [
  createCompanyClientSchema,
  createIndividualClientSchema,
]);
export type CreateClientDto = z.infer<typeof createClientSchema>;

/**
 * Update DTO — flat and fully optional. `type` is immutable (a company never becomes
 * an individual), so it is intentionally absent here. The per-type DB CHECK constraint
 * still prevents nulling a required field (e.g. a company's legalName).
 */
export const updateClientSchema = z
  .object({
    email: z.string().trim().email().max(180).optional().nullable(),
    phone: z.string().trim().max(40).optional().nullable(),
    ownerName: z.string().trim().min(1).max(120).optional(),
    legalName: z.string().trim().min(1).max(180).optional(),
    siren: z.string().trim().regex(/^\d{9}$/, 'Le SIREN doit comporter 9 chiffres').optional().nullable(),
    industry: z.string().trim().max(120).optional().nullable(),
    headcount: headcountBandSchema.optional().nullable(),
    contactName: z.string().trim().max(120).optional().nullable(),
    contactRole: z.string().trim().max(120).optional().nullable(),
    contactEmail: z.string().trim().email().max(180).optional().nullable(),
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Aucun champ à mettre à jour');
export type UpdateClientDto = z.infer<typeof updateClientSchema>;

/** Filters for the clients list. */
export const listClientsQuerySchema = z.object({
  type: clientTypeSchema.optional(),
  search: z.string().trim().max(160).optional(),
});
export type ListClientsQuery = z.infer<typeof listClientsQuerySchema>;

/** Read model returned by the API. `displayName` is derived server-side. */
export const clientSchema = z.object({
  id: z.string().uuid(),
  type: clientTypeSchema,
  displayName: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  ownerName: z.string(),
  // Company-only (null for individuals)
  legalName: z.string().nullable(),
  siren: z.string().nullable(),
  industry: z.string().nullable(),
  headcount: headcountBandSchema.nullable(),
  contactName: z.string().nullable(),
  contactRole: z.string().nullable(),
  contactEmail: z.string().nullable(),
  // Individual-only (null for companies)
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ClientDto = z.infer<typeof clientSchema>;
