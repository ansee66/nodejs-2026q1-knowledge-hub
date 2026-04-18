import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { API_MESSAGES } from 'src/common/constants/api-messages.constants';
import { ApiNoContentResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { GetArticlesQueryDto } from './dto/get-articles-query.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  async getAll(@Query() query: GetArticlesQueryDto) {
    return await this.articleService.findAll(query);
  }

  @Get(':id')
  @ApiNotFoundResponse({ description: API_MESSAGES.ARTICLE.NOT_FOUND })
  async getById(@Param('id') id: string) {
    if (!isUUID(id)) {
      throw new BadRequestException(API_MESSAGES.COMMON.INVALID_UUID);
    }

    return await this.articleService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateArticleDto, @CurrentUser() user: JwtPayload) {
    return await this.articleService.create(dto, user);
  }

  @Put(':id')
  @ApiNotFoundResponse({ description: API_MESSAGES.ARTICLE.NOT_FOUND })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!isUUID(id)) {
      throw new BadRequestException(API_MESSAGES.COMMON.INVALID_UUID);
    }

    return await this.articleService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: API_MESSAGES.ARTICLE.DELETED })
  @ApiNotFoundResponse({ description: API_MESSAGES.ARTICLE.NOT_FOUND })
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    if (!isUUID(id)) {
      throw new BadRequestException(API_MESSAGES.COMMON.INVALID_UUID);
    }

    await this.articleService.delete(id, user);
  }
}
