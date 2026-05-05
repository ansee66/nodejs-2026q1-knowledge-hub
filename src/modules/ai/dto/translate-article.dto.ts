import { IsString, IsOptional } from 'class-validator';

export class TranslateArticleDto {
  @IsString()
  targetLanguage: string;

  @IsString()
  @IsOptional()
  sourceLanguage?: string;
}
