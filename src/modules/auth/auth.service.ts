import 'dotenv/config';
import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../user/types/user.interface';
import { SignupDto } from './dto/signup.dto';
import { API_MESSAGES } from 'src/common/constants/api-messages.constants';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { AuthTokensResponseDto } from './dto/auth-tokens-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  private async generateTokens(user: User): Promise<AuthTokensResponseDto> {
    const payload: JwtPayload = {
      userId: user.id,
      login: user.login,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET_KEY,
      expiresIn: process.env.TOKEN_EXPIRE_TIME,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET_REFRESH_KEY,
      expiresIn: process.env.TOKEN_REFRESH_EXPIRE_TIME,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async signup(dto: SignupDto): Promise<void> {
    const existedUser = await this.userService.findByLogin(dto.login);
    if (existedUser) {
      throw new BadRequestException(API_MESSAGES.AUTH.BUSY_LOGIN);
    }

    const hash = await bcrypt.hash(
      dto.password,
      Number(process.env.CRYPT_SALT),
    );

    await this.userService.create({
      login: dto.login,
      password: hash,
    });
  }

  async login(dto: LoginDto): Promise<AuthTokensResponseDto> {
    const user = await this.userService.findByLogin(dto.login);
    if (!user) {
      throw new ForbiddenException(API_MESSAGES.AUTH.INVALID_LOGIN);
    }

    const isPasswordCorrect = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordCorrect) {
      throw new ForbiddenException(API_MESSAGES.AUTH.INVALID_PASSWORD);
    }

    return this.generateTokens(user);
  }

  async refresh(dto: RefreshDto) {
    console.log('refresh dto', dto);
    if (!dto.refreshToken) {
      throw new UnauthorizedException(
        API_MESSAGES.AUTH.REFRESH_TOKEN_IS_REQUIRED,
      );
    }

    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(
        dto.refreshToken,
        {
          secret: process.env.JWT_SECRET_REFRESH_KEY,
        },
      );
    } catch {
      throw new ForbiddenException(API_MESSAGES.AUTH.INVALID_REFRESH_TOKEN);
    }

    const user = await this.userService.findById(payload.userId);
    if (!user) throw new ForbiddenException(API_MESSAGES.AUTH.INVALID_LOGIN);

    return this.generateTokens(user);
  }
}
