import { IsString, MinLength } from 'class-validator';

export class GenerateDto {
  @IsString()
  @MinLength(5)
  prompt: string;
}
