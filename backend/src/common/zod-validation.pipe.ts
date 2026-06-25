import { ArgumentMetadata, BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';

/**
 * Validates and transforms a payload against a Zod schema from `@crm/contracts`.
 * Zod errors are rethrown as `BadRequestException` carrying field-level details,
 * which the global filter renders into the standard error envelope.
 *
 * @author Mohamed Marwen Maalawi
 */
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown, _metadata: ArgumentMetadata): T {
    try {
      return this.schema.parse(value);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException({
          message: 'Validation échouée',
          details: err.issues.map((i) => ({
            path: i.path.join('.') || '(racine)',
            message: i.message,
          })),
        });
      }
      throw err;
    }
  }
}
