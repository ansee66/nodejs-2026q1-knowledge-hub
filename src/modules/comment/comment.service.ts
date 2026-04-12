import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ArticleService } from '../article/article.service';
import { Comment } from './comment.interface';
import { API_MESSAGES } from 'src/common/constants/api-messages.constants';
import { GetCommentsQueryDto } from './dto/get-comments-query.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CommentService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ArticleService))
    private readonly articleService: ArticleService,
  ) {}

  private mapComment(comment: any): Comment {
    return {
      ...comment,
      createdAt: comment.createdAt.getTime(),
    };
  }

  async findAll(query: GetCommentsQueryDto): Promise<Comment[]> {
    const comments = await this.prisma.comment.findMany({
      where: {
        articleId: query.articleId,
      },
    });

    return comments.map((c) => this.mapComment(c));
  }

  async findById(id: string): Promise<Comment> {
    const comment = await this.prisma.comment.findUnique({ where: { id } });

    if (!comment) {
      throw new NotFoundException(API_MESSAGES.COMMENT.NOT_FOUND);
    }

    return this.mapComment(comment);
  }

  async create(dto: CreateCommentDto): Promise<Comment> {
    try {
      this.articleService.findById(dto.articleId);
    } catch {
      throw new UnprocessableEntityException(API_MESSAGES.ARTICLE.NOT_FOUND);
    }

    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        articleId: dto.articleId,
        authorId: dto.authorId ?? null,
      },
    });

    return this.mapComment(comment);
  }

  async delete(id: string): Promise<void> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException(API_MESSAGES.COMMENT.NOT_FOUND);
    }

    await this.prisma.comment.delete({
      where: { id },
    });
  }
}
