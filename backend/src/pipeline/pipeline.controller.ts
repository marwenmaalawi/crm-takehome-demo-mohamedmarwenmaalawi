import { Controller, Get } from '@nestjs/common';
import { PipelineService } from './pipeline.service';

@Controller('pipeline')
export class PipelineController {
  constructor(private readonly pipeline: PipelineService) {}

  /** GET /pipeline/summary — the numeric pipeline recap. */
  @Get('summary')
  summary() {
    return this.pipeline.summary();
  }

  /** GET /pipeline/attention — actionable lists (overdue / stalled / upcoming signatures). */
  @Get('attention')
  attention() {
    return this.pipeline.attention();
  }

  /** GET /pipeline/board — OPEN opportunities grouped by stage (read-only pipeline view). */
  @Get('board')
  board() {
    return this.pipeline.board();
  }
}
