import { IsEnum, IsOptional } from 'class-validator';

export enum SummaryLength {
  SHORT = 'short',
  MEDIUM = 'medium',
  DETAILED = 'detailed',
}

export class SummarizeArticleDto {
  @IsOptional()
  @IsEnum(SummaryLength)
  maxLength?: SummaryLength;
}
