import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { createActivitySchema, type CreateActivityDto } from '@crm/contracts';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ActivitiesService } from './activities.service';

/** Activities are nested under their opportunity. */
@Controller('opportunities/:opportunityId/activities')
export class ActivitiesController {
  constructor(private readonly activities: ActivitiesService) {}

  @Get()
  list(@Param('opportunityId', ParseUUIDPipe) opportunityId: string) {
    return this.activities.listForOpportunity(opportunityId);
  }

  @Post()
  create(
    @Param('opportunityId', ParseUUIDPipe) opportunityId: string,
    @Body(new ZodValidationPipe(createActivitySchema)) dto: CreateActivityDto,
  ) {
    return this.activities.createForOpportunity(opportunityId, dto);
  }
}
