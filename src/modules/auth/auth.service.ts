import 'dotenv/config';
import { Injectable, BadRequestException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { SignupDto } from './dto/signup.dto';
import { API_MESSAGES } from 'src/common/constants/api-messages.constants';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async signup(dto: SignupDto): Promise<void> {
    const existedUser = await this.userService.findByLogin(dto.login);
    if (existedUser) {
      throw new BadRequestException(API_MESSAGES.AUTH.BUSY_LOGIN);
    }

    const hash = await bcrypt.hash(dto.password, process.env.CRYPT_SALT);

    await this.userService.create({
      login: dto.login,
      password: hash,
    });
  }
}
