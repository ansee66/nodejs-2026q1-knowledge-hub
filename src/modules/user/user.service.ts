import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CRYPT_SALT } from '../../common/constants/app.constants';
import { User } from './types/user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from '@prisma/client';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { API_MESSAGES } from 'src/common/constants/api-messages.constants';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  private mapUser(user: any): User {
    return {
      ...user,
      createdAt: user.createdAt.getTime(),
      updatedAt: user.updatedAt.getTime(),
    };
  }

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany();
    return users.map(this.mapUser);
  }

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(API_MESSAGES.USER.NOT_FOUND);
    }

    return this.mapUser(user);
  }

  async findByLogin(login: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { login } });
    return user ? this.mapUser(user) : null;
  }

  async create(dto: CreateUserDto): Promise<User> {
    const hash = await bcrypt.hash(dto.password, CRYPT_SALT);
    const user = await this.prisma.user.create({
      data: {
        login: dto.login,
        password: hash,
        role: dto.role ?? UserRole.viewer,
      },
    });
    return this.mapUser(user);
  }

  async updatePassword(id: string, dto: UpdatePasswordDto): Promise<User> {
    const user = await this.findById(id);
    const isPasswordCorrect = await bcrypt.compare(
      dto.oldPassword,
      user.password,
    );

    if (!isPasswordCorrect) {
      throw new ForbiddenException(API_MESSAGES.USER.WRONG_PASSWORD);
    }

    const hash = await bcrypt.hash(dto.newPassword, CRYPT_SALT);
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        password: hash,
      },
    });
    return this.mapUser(updatedUser);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.prisma.user.delete({
      where: { id },
    });
  }
}
