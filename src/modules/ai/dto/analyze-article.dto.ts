import { IsEnum, IsOptional } from 'class-validator';

export enum AnalysisTask {
  REVIEW = 'review',
  BUGS = 'bugs',
  OPTIMIZE = 'optimize',
  EXPLAIN = 'explain',
}

export class AnalyzeArticleDto {
  @IsOptional()
  @IsEnum(AnalysisTask)
  task?: AnalysisTask;
}
