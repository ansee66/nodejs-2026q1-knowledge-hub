import { IsEnum, IsOptional, IsString, IsArray } from 'class-validator';
import { ArticleStatus } from '../../../common/enums';

export class CreateArticleDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsEnum(ArticleStatus)
  status: ArticleStatus;

  @IsOptional()
  @IsString()
  authorId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsArray()
  @IsString({ each: true })
  tags: string[];
}
