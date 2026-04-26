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
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ExcludePasswordInterceptor } from 'src/common/interceptors/exclude-password';
import { isUUID } from 'class-validator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { API_MESSAGES } from 'src/common/constants/api-messages.constants';
import { ApiNoContentResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('user')
@UseInterceptors(ExcludePasswordInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAll() {
    return await this.userService.findAll();
  }

  @Get(':id')
  @ApiNotFoundResponse({ description: API_MESSAGES.USER.NOT_FOUND })
  async getById(@Param('id') id: string) {
    if (!isUUID(id)) {
      throw new BadRequestException(API_MESSAGES.COMMON.INVALID_UUID);
    }

    return await this.userService.findById(id);
  }

  @Post()
  @Roles(UserRole.admin)
  async create(@Body() dto: CreateUserDto) {
    return await this.userService.create(dto);
  }

  @Put(':id')
  @Roles(UserRole.admin)
  @ApiNotFoundResponse({ description: API_MESSAGES.USER.NOT_FOUND })
  async updatePassword(
    @Param('id') id: string,
    @Body() dto: UpdatePasswordDto,
  ) {
    if (!isUUID(id)) {
      throw new BadRequestException(API_MESSAGES.COMMON.INVALID_UUID);
    }

    return await this.userService.updatePassword(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: API_MESSAGES.USER.DELETED })
  @ApiNotFoundResponse({ description: API_MESSAGES.USER.NOT_FOUND })
  async delete(@Param('id') id: string) {
    if (!isUUID(id)) {
      throw new BadRequestException(API_MESSAGES.COMMON.INVALID_UUID);
    }

    await this.userService.delete(id);
  }
}
