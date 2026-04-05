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

@Controller('user')
@UseInterceptors(ExcludePasswordInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  getAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiNotFoundResponse({ description: API_MESSAGES.USER.NOT_FOUND })
  getById(@Param('id') id: string) {
    if (!isUUID(id)) {
      throw new BadRequestException(API_MESSAGES.COMMON.INVALID_UUID);
    }

    return this.userService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Put(':id')
  @ApiNotFoundResponse({ description: API_MESSAGES.USER.NOT_FOUND })
  updatePassword(@Param('id') id: string, @Body() dto: UpdatePasswordDto) {
    if (!isUUID(id)) {
      throw new BadRequestException(API_MESSAGES.COMMON.INVALID_UUID);
    }

    return this.userService.updatePassword(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: API_MESSAGES.USER.DELETED })
  @ApiNotFoundResponse({ description: API_MESSAGES.USER.NOT_FOUND })
  delete(@Param('id') id: string) {
    if (!isUUID(id)) {
      throw new BadRequestException(API_MESSAGES.COMMON.INVALID_UUID);
    }

    this.userService.delete(id);
  }
}
