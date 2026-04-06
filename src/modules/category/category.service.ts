import { Injectable, NotFoundException } from '@nestjs/common';
import { Category } from './category.interface';
import { API_MESSAGES } from 'src/common/constants/api-messages.constants';
import { randomUUID } from 'node:crypto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ArticleService } from '../article/article.service';

@Injectable()
export class CategoryService {
  constructor(private readonly articleService: ArticleService) {}
  private categories: Category[] = [];

  findAll(): Category[] {
    return this.categories;
  }

  findById(id: string): Category {
    const category = this.categories.find((category) => category.id === id);

    if (!category) {
      throw new NotFoundException(API_MESSAGES.CATEGORY.NOT_FOUND);
    }

    return category;
  }

  create(dto: CreateCategoryDto): Category {
    const category: Category = {
      id: randomUUID(),
      name: dto.name,
      description: dto.description,
    };

    this.categories.push(category);

    return category;
  }

  update(id: string, dto: UpdateCategoryDto): Category {
    const category = this.findById(id);

    category.name = dto.name;
    category.description = dto.description;

    return category;
  }

  delete(id: string): void {
    const index = this.categories.findIndex((category) => category.id === id);

    if (index === -1) {
      throw new NotFoundException(API_MESSAGES.CATEGORY.NOT_FOUND);
    }

    this.articleService.unsetCategoryId(id);

    this.categories.splice(index, 1);
  }
}
