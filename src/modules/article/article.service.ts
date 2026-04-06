import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Article } from './article.interface';
import { ArticleStatus } from 'src/common/enums';
import { API_MESSAGES } from 'src/common/constants/api-messages.constants';
import { GetArticlesQueryDto } from './dto/get-articles-query.dto';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Injectable()
export class ArticleService {
  private articles: Article[] = [];

  findAll(query: GetArticlesQueryDto): Article[] {
    let result = [...this.articles];

    if (query.status) {
      result = result.filter((article) => article.status === query.status);
    }

    if (query.categoryId) {
      result = result.filter(
        (article) => article.categoryId === query.categoryId,
      );
    }

    if (query.tag) {
      result = result.filter((article) => article.tags.includes(query.tag));
    }

    return result;
  }

  findById(id: string): Article {
    const article = this.articles.find((a) => a.id === id);

    if (!article) {
      throw new NotFoundException(API_MESSAGES.ARTICLE.NOT_FOUND);
    }

    return article;
  }

  create(dto: CreateArticleDto): Article {
    const now = Date.now();

    const article: Article = {
      id: randomUUID(),
      title: dto.title,
      content: dto.content,
      status: dto.status ?? ArticleStatus.DRAFT,
      authorId: dto.authorId ?? null,
      categoryId: dto.categoryId ?? null,
      tags: dto.tags,
      createdAt: now,
      updatedAt: now,
    };

    this.articles.push(article);

    return article;
  }

  update(id: string, dto: UpdateArticleDto): Article {
    const article = this.findById(id);

    if (dto.title !== undefined) article.title = dto.title;
    if (dto.content !== undefined) article.content = dto.content;
    if (dto.status !== undefined) article.status = dto.status;
    if (dto.authorId !== undefined) article.authorId = dto.authorId;
    if (dto.categoryId !== undefined) article.categoryId = dto.categoryId;
    if (dto.tags !== undefined) article.tags = dto.tags;
    article.updatedAt = Date.now();

    return article;
  }

  delete(id: string): void {
    const index = this.articles.findIndex((article) => article.id === id);

    if (index === -1) {
      throw new NotFoundException(API_MESSAGES.ARTICLE.NOT_FOUND);
    }

    this.articles.splice(index, 1);
  }
}
