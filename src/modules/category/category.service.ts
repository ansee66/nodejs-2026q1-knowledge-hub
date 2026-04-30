import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Category } from './category.interface';
import { API_MESSAGES } from 'src/common/constants/api-messages.constants';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  private checkRole(user: JwtPayload): void {
    if (user.role === UserRole.editor) {
      throw new ForbiddenException(API_MESSAGES.ROLES.CATEGORY_LIMITATIONS);
    }
  }

  async findAll(): Promise<Category[]> {
    return await this.prisma.category.findMany();
  }

  async findById(id: string): Promise<Category> {
    const category = await this.prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundException(API_MESSAGES.CATEGORY.NOT_FOUND);
    }

    return category;
  }

  async create(dto: CreateCategoryDto, user: JwtPayload): Promise<Category> {
    this.checkRole(user);

    return await this.prisma.category.create({
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async update(
    id: string,
    dto: UpdateCategoryDto,
    user: JwtPayload,
  ): Promise<Category> {
    this.checkRole(user);

    const category = await this.findById(id);

    category.name = dto.name;
    category.description = dto.description;

    return await this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async delete(id: string, user: JwtPayload): Promise<void> {
    this.checkRole(user);

    await this.findById(id);

    await this.prisma.category.delete({
      where: { id },
    });
  }
}
