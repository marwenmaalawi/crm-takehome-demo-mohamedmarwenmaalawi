import { z } from 'zod';
import { activityTypeSchema } from './enums';

/**
 * Activity contracts — a logged interaction (call/email/meeting/note) on an opportunity.
 * The activity timeline is what makes this a CRM rather than a record store.
 *
 * @author Mohamed Marwen Maalawi
 */

export const createActivitySchema = z.object({
  type: activityTypeSchema,
  summary: z.string().trim().min(1, 'Résumé requis').max(1000),
  /** ISO date or date-time; the API stores it as an instant. */
  occurredAt: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), 'Date invalide'),
  authorName: z.string().trim().min(1, 'Auteur requis').max(120),
});
export type CreateActivityDto = z.infer<typeof createActivitySchema>;

export const activitySchema = z.object({
  id: z.string().uuid(),
  type: activityTypeSchema,
  summary: z.string(),
  occurredAt: z.string(),
  authorName: z.string(),
  opportunityId: z.string().uuid(),
  createdAt: z.string(),
});
export type ActivityDto = z.infer<typeof activitySchema>;
