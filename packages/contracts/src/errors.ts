import { z } from 'zod';

/** The single error envelope returned by the API (see DECISIONS.md §5). */
export const apiErrorSchema = z.object({
  statusCode: z.number().int(),
  error: z.string(),
  message: z.string(),
  /** Field-level validation issues, when applicable. */
  details: z
    .array(z.object({ path: z.string(), message: z.string() }))
    .optional(),
  path: z.string().optional(),
  timestamp: z.string().optional(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;
