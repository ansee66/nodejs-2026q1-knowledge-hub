import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommentService } from '../comment/comment.service';
import { Article } from './article.interface';
import { Prisma, ArticleStatus, UserRole } from '@prisma/client';
import { API_MESSAGES } from 'src/common/constants/api-messages.constants';
import { GetArticlesQueryDto } from './dto/get-articles-query.dto';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class ArticleService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => CommentService))
    private readonly commentService: CommentService,
  ) {}

  private mapArticle(
    article: Prisma.ArticleGetPayload<{
      include: { tags: true };
    }>,
  ): Article {
    return {
      ...article,
      createdAt: article.createdAt.getTime(),
      updatedAt: article.updatedAt.getTime(),
      tags: article.tags?.map((t) => t.name) ?? [],
    };
  }

  private assertUserOwnsArticle(
    user: JwtPayload,
    articleAuthorId: string | null,
  ): void {
    if (user.role === UserRole.editor && articleAuthorId !== user.userId) {
      throw new ForbiddenException(API_MESSAGES.ROLES.EDITOR_LIMITATIONS);
    }
  }

  async findAll(query: GetArticlesQueryDto): Promise<Article[]> {
    const where: Prisma.ArticleWhereInput = {};

    if (query.status) {
      where.status = query.status as ArticleStatus;
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.tag) {
      where.tags = {
        some: {
          name: query.tag,
        },
      };
    }

    const articles = await this.prisma.article.findMany({
      where,
      include: {
        tags: true,
      },
    });

    return articles.map((a) => this.mapArticle(a));
  }

  async findById(id: string): Promise<Article> {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: { tags: true },
    });

    if (!article) {
      throw new NotFoundException(API_MESSAGES.ARTICLE.NOT_FOUND);
    }

    return this.mapArticle(article);
  }

  async create(dto: CreateArticleDto, user: JwtPayload): Promise<Article> {
    const authorId =
      user.role === UserRole.editor ? user.userId : (dto.authorId ?? null);
    const article = await this.prisma.article.create({
      data: {
        title: dto.title,
        content: dto.content,
        status: dto.status ?? ArticleStatus.draft,
        authorId: authorId,
        categoryId: dto.categoryId ?? null,

        tags: {
          connectOrCreate: dto.tags.map((tag) => ({
            where: { name: tag },
            create: { name: tag },
          })),
        },
      },
      include: { tags: true },
    });

    return this.mapArticle(article);
  }

  async update(
    id: string,
    dto: UpdateArticleDto,
    user: JwtPayload,
  ): Promise<Article> {
    const prevArticle = await this.findById(id);
    this.assertUserOwnsArticle(user, prevArticle.authorId);

    const article = await this.prisma.article.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.authorId !== undefined && { authorId: dto.authorId }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),

        ...(dto.tags !== undefined && {
          tags: {
            set: [],
            connectOrCreate: dto.tags.map((tag) => ({
              where: { name: tag },
              create: { name: tag },
            })),
          },
        }),
      },
      include: { tags: true },
    });

    return this.mapArticle(article);
  }

  async delete(id: string, user: JwtPayload): Promise<void> {
    const prevArticle = await this.findById(id);
    this.assertUserOwnsArticle(user, prevArticle.authorId);

    await this.prisma.article.delete({
      where: { id },
    });
  }
}
