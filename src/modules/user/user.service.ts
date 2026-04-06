import { randomUUID } from 'node:crypto';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from './types/user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from 'src/common/enums';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { API_MESSAGES } from 'src/common/constants/api-messages.constants';
import { CommentService } from '../comment/comment.service';
import { ArticleService } from '../article/article.service';

@Injectable()
export class UserService {
  constructor(
    private readonly articleService: ArticleService,
    private readonly commentService: CommentService,
  ) {}
  private users: User[] = [];

  findAll(): User[] {
    return this.users;
  }

  findById(id: string): User {
    const user = this.users.find((user) => user.id === id);

    if (!user) {
      throw new NotFoundException(API_MESSAGES.USER.NOT_FOUND);
    }

    return user;
  }

  create(dto: CreateUserDto): User {
    const now = Date.now();

    const user: User = {
      id: randomUUID(),
      login: dto.login,
      password: dto.password,
      role: dto.role ?? UserRole.VIEWER,
      createdAt: now,
      updatedAt: now,
    };

    this.users.push(user);

    return user;
  }

  updatePassword(id: string, dto: UpdatePasswordDto): User {
    const user = this.findById(id);

    if (user.password !== dto.oldPassword) {
      throw new ForbiddenException(API_MESSAGES.USER.WRONG_PASSWORD);
    }

    user.password = dto.newPassword;
    user.updatedAt = Date.now();

    return user;
  }

  delete(id: string): void {
    const index = this.users.findIndex((user) => user.id === id);

    if (index === -1) {
      throw new NotFoundException(API_MESSAGES.USER.NOT_FOUND);
    }

    this.articleService.unsetAuthorId(id);
    this.commentService.deleteByAuthorId(id);

    this.users.splice(index, 1);
  }
}
