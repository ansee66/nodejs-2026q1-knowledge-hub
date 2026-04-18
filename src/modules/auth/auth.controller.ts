import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiCreatedResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { API_MESSAGES } from 'src/common/constants/api-messages.constants';
import { Public } from './decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({
    default: {
      limit: Number(process.env.IP_TIME_LIMIT),
      ttl: Number(process.env.IP_AUTH_REQUESTS_LIMIT),
    },
  })
  @Post('signup')
  @ApiCreatedResponse({ description: API_MESSAGES.AUTH.SUCCESS_SIGNUP })
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Public()
  @Throttle({
    default: {
      limit: Number(process.env.IP_TIME_LIMIT),
      ttl: Number(process.env.IP_AUTH_REQUESTS_LIMIT),
    },
  })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }
}
