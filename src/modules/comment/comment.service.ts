import {
  ForbiddenException,
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
import { UserRole } from '@prisma/client';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

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

  private assertUserOwnsComment(
    user: JwtPayload,
    commentAuthorId: string | null,
  ): void {
    if (user.role === UserRole.EDITOR && commentAuthorId !== user.userId) {
      throw new ForbiddenException(API_MESSAGES.ROLES.EDITOR_LIMITATIONS);
    }
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

  async create(dto: CreateCommentDto, user: JwtPayload): Promise<Comment> {
    try {
      this.articleService.findById(dto.articleId);
    } catch {
      throw new UnprocessableEntityException(API_MESSAGES.ARTICLE.NOT_FOUND);
    }

    const authorId =
      user.role === UserRole.EDITOR ? user.userId : (dto.authorId ?? null);
    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        articleId: dto.articleId,
        authorId: authorId,
      },
    });

    return this.mapComment(comment);
  }

  async delete(id: string, user: JwtPayload): Promise<void> {
    const comment = await this.findById(id);

    this.assertUserOwnsComment(user, comment.authorId);

    await this.prisma.comment.delete({
      where: { id },
    });
  }
}
