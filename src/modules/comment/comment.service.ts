import { randomUUID } from 'node:crypto';
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

@Injectable()
export class CommentService {
  constructor(
    @Inject(forwardRef(() => ArticleService))
    private readonly articleService: ArticleService,
  ) {}

  private comments: Comment[] = [];

  findAll(query: GetCommentsQueryDto): Comment[] {
    return this.comments.filter((c) => c.articleId === query.articleId);
  }

  findById(id: string): Comment {
    const comment = this.comments.find((c) => c.id === id);

    if (!comment) {
      throw new NotFoundException(API_MESSAGES.COMMENT.NOT_FOUND);
    }

    return comment;
  }

  create(dto: CreateCommentDto): Comment {
    try {
      this.articleService.findById(dto.articleId);
    } catch {
      throw new UnprocessableEntityException(API_MESSAGES.ARTICLE.NOT_FOUND);
    }

    const now = Date.now();

    const comment: Comment = {
      id: randomUUID(),
      content: dto.content,
      articleId: dto.articleId,
      authorId: dto.authorId ?? null,
      createdAt: now,
    };

    this.comments.push(comment);

    return comment;
  }

  delete(id: string): void {
    const index = this.comments.findIndex((comment) => comment.id === id);

    if (index === -1) {
      throw new NotFoundException(API_MESSAGES.COMMENT.NOT_FOUND);
    }

    this.comments.splice(index, 1);
  }

  deleteByArticleId(articleId: string): void {
    this.comments = this.comments.filter((c) => c.articleId !== articleId);
  }

  deleteByAuthorId(authorId: string): void {
    this.comments = this.comments.filter((c) => c.authorId !== authorId);
  }
}
