import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { TokenBlacklistService } from './token-blacklist.service';

import { makePrismaUser } from '../../../test/factories/user.factory';
import { UserRole } from '@prisma/client';
import { TEST_USER, TOKENS } from '../../../test/constants';

vi.mock('bcrypt', () => ({
  compare: vi.fn<() => Promise<boolean>>(),
}));

const SIGNUP_DTO = { login: TEST_USER.login, password: TEST_USER.password };
const LOGIN_DTO = { login: TEST_USER.login, password: TEST_USER.password };

const makeUser = (overrides = {}) => ({
  ...makePrismaUser(),
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

const makeJwtPayload = (overrides = {}) => ({
  userId: TEST_USER.id,
  login: TEST_USER.login,
  role: UserRole.viewer,
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;
  let userService: Record<string, ReturnType<typeof vi.fn>>;
  let jwtService: Record<string, ReturnType<typeof vi.fn>>;
  let blacklist: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    userService = {
      findByLogin: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
    };

    jwtService = {
      signAsync: vi.fn(),
      verifyAsync: vi.fn(),
    };

    blacklist = {
      has: vi.fn().mockReturnValue(false),
      add: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
        { provide: TokenBlacklistService, useValue: blacklist },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('signup', () => {
    it('creates user and returns id', async () => {
      userService.findByLogin.mockResolvedValue(null);
      userService.create.mockResolvedValue(makeUser());

      const result = await service.signup(SIGNUP_DTO);

      expect(userService.create).toHaveBeenCalledWith({
        login: SIGNUP_DTO.login,
        password: SIGNUP_DTO.password,
      });
      expect(result).toEqual({ id: TEST_USER.id });
    });

    it('throws BadRequestException on duplicate login', async () => {
      userService.findByLogin.mockResolvedValue(makeUser());

      await expect(service.signup(SIGNUP_DTO)).rejects.toThrow(
        BadRequestException,
      );
      expect(userService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns tokens on valid credentials', async () => {
      userService.findByLogin.mockResolvedValue(makeUser());
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      jwtService.signAsync
        .mockResolvedValueOnce(TOKENS.access)
        .mockResolvedValueOnce(TOKENS.refresh);

      const result = await service.login(LOGIN_DTO);

      expect(result).toEqual({
        accessToken: TOKENS.access,
        refreshToken: TOKENS.refresh,
      });
    });

    it('throws ForbiddenException when user not found', async () => {
      userService.findByLogin.mockResolvedValue(null);

      await expect(service.login(LOGIN_DTO)).rejects.toThrow(
        ForbiddenException,
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException on wrong password', async () => {
      userService.findByLogin.mockResolvedValue(makeUser());
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(service.login(LOGIN_DTO)).rejects.toThrow(
        ForbiddenException,
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('generates tokens with correct payload', async () => {
      const user = makeUser({ role: UserRole.admin });
      userService.findByLogin.mockResolvedValue(user);
      vi.mocked(bcrypt.compare).mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue(TOKENS.access);

      await service.login(LOGIN_DTO);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: user.id,
          login: user.login,
          role: UserRole.admin,
        }),
        expect.any(Object),
      );
    });
  });

  describe('refresh', () => {
    it('returns new tokens on valid refresh token', async () => {
      jwtService.verifyAsync.mockResolvedValue(makeJwtPayload());
      userService.findById.mockResolvedValue(makeUser());
      jwtService.signAsync
        .mockResolvedValueOnce(TOKENS.access)
        .mockResolvedValueOnce(TOKENS.refresh);

      const result = await service.refresh({ refreshToken: TOKENS.refresh });

      expect(result).toEqual({
        accessToken: TOKENS.access,
        refreshToken: TOKENS.refresh,
      });
    });

    it('throws UnauthorizedException when refreshToken missing', async () => {
      await expect(
        service.refresh({ refreshToken: undefined }),
      ).rejects.toThrow(UnauthorizedException);

      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when token is revoked', async () => {
      blacklist.has.mockReturnValue(true);

      await expect(
        service.refresh({ refreshToken: TOKENS.revoked }),
      ).rejects.toThrow(ForbiddenException);

      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException on expired token', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(
        service.refresh({ refreshToken: TOKENS.expired }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException on malformed token', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));

      await expect(
        service.refresh({ refreshToken: TOKENS.malformed }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when user from token not found', async () => {
      jwtService.verifyAsync.mockResolvedValue(makeJwtPayload());
      userService.findById.mockResolvedValue(null);

      await expect(
        service.refresh({ refreshToken: TOKENS.refresh }),
      ).rejects.toThrow(ForbiddenException);

      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('issues new tokens with fresh payload after rotation', async () => {
      const payload = makeJwtPayload({ role: UserRole.admin });
      jwtService.verifyAsync.mockResolvedValue(payload);
      userService.findById.mockResolvedValue(
        makeUser({ role: UserRole.admin }),
      );
      jwtService.signAsync.mockResolvedValue(TOKENS.access);

      await service.refresh({ refreshToken: TOKENS.refresh });

      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.admin }),
        expect.any(Object),
      );
    });
  });

  describe('logout', () => {
    it('adds token to blacklist', async () => {
      await service.logout({ refreshToken: TOKENS.refresh });

      expect(blacklist.add).toHaveBeenCalledWith(TOKENS.refresh);
    });
  });
});
