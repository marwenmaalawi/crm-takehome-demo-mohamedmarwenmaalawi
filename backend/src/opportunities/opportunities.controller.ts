import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  createOpportunitySchema,
  listOpportunitiesQuerySchema,
  updateOpportunitySchema,
  type CreateOpportunityDto,
  type ListOpportunitiesQuery,
  type UpdateOpportunityDto,
} from '@crm/contracts';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { OpportunitiesService } from './opportunities.service';

@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunities: OpportunitiesService) {}

  @Post()
  create(@Body(new ZodValidationPipe(createOpportunitySchema)) dto: CreateOpportunityDto) {
    return this.opportunities.create(dto);
  }

  @Get()
  list(@Query(new ZodValidationPipe(listOpportunitiesQuerySchema)) query: ListOpportunitiesQuery) {
    return this.opportunities.list(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.opportunities.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateOpportunitySchema)) dto: UpdateOpportunityDto,
  ) {
    return this.opportunities.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.opportunities.remove(id);
  }
}
