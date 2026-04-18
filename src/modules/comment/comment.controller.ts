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
  Query,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { API_MESSAGES } from 'src/common/constants/api-messages.constants';
import { ApiNoContentResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { GetCommentsQueryDto } from './dto/get-comments-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  async getAll(@Query() query: GetCommentsQueryDto) {
    if (!query.articleId) {
      throw new BadRequestException(API_MESSAGES.COMMENT.ARTICLE_ID_REQUIRED);
    }
    return await this.commentService.findAll(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    if (!isUUID(id)) {
      throw new BadRequestException(API_MESSAGES.COMMON.INVALID_UUID);
    }

    return await this.commentService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateCommentDto, @CurrentUser() user: JwtPayload) {
    return await this.commentService.create(dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: API_MESSAGES.COMMENT.DELETED })
  @ApiNotFoundResponse({ description: API_MESSAGES.COMMENT.NOT_FOUND })
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    if (!isUUID(id)) {
      throw new BadRequestException(API_MESSAGES.COMMON.INVALID_UUID);
    }

    await this.commentService.delete(id, user);
  }
}
