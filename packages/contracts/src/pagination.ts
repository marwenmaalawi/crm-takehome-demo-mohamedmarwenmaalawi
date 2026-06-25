import { z } from 'zod';

/** Server-side pagination envelope — the count is what makes server pagination usable by the UI. */
export const paginationMetaSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

export const paginated = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ data: z.array(item), meta: paginationMetaSchema });

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}
