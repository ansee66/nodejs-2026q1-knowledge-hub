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
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { API_MESSAGES } from 'src/common/constants/api-messages.constants';
import { ApiNoContentResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  getAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  @ApiNotFoundResponse({ description: API_MESSAGES.CATEGORY.NOT_FOUND })
  getById(@Param('id') id: string) {
    if (!isUUID(id)) {
      throw new BadRequestException(API_MESSAGES.COMMON.INVALID_UUID);
    }

    return this.categoryService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto);
  }

  @Put(':id')
  @ApiNotFoundResponse({ description: API_MESSAGES.CATEGORY.NOT_FOUND })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    if (!isUUID(id)) {
      throw new BadRequestException(API_MESSAGES.COMMON.INVALID_UUID);
    }

    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: API_MESSAGES.CATEGORY.DELETED })
  @ApiNotFoundResponse({ description: API_MESSAGES.CATEGORY.NOT_FOUND })
  delete(@Param('id') id: string) {
    if (!isUUID(id)) {
      throw new BadRequestException(API_MESSAGES.COMMON.INVALID_UUID);
    }

    this.categoryService.delete(id);
  }
}
