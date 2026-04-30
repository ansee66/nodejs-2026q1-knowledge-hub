import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TEST_USER, TOKENS } from '../../../../test/constants';
import { UserRole } from '@prisma/client';

const JWT_PAYLOAD = {
  userId: TEST_USER.id,
  login: TEST_USER.login,
  role: UserRole.viewer,
};

const makeReflector = (isPublic = false) => ({
  getAllAndOverride: vi.fn().mockReturnValue(isPublic),
});

const makeExecutionContext = (
  headers: Record<string, string> = {},
  params = {},
) => {
  const request = { headers, user: undefined, params };
  return {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: vi.fn().mockReturnValue({
      getRequest: vi.fn().mockReturnValue(request),
    }),
    request,
  } as unknown as ExecutionContext & { request: typeof request };
};

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: { verifyAsync: ReturnType<typeof vi.fn> };
  let reflector: ReturnType<typeof makeReflector>;

  beforeEach(() => {
    jwtService = { verifyAsync: vi.fn() };
    reflector = makeReflector();
    guard = new JwtAuthGuard(
      jwtService as unknown as JwtService,
      reflector as unknown as Reflector,
    );
  });

  afterEach(() => vi.clearAllMocks());

  describe('public routes', () => {
    it('allows access without token when route is @Public()', async () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const ctx = makeExecutionContext();

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });
  });

  describe('valid token', () => {
    it('passes and attaches user to request', async () => {
      jwtService.verifyAsync.mockResolvedValue(JWT_PAYLOAD);
      const ctx = makeExecutionContext({
        authorization: `Bearer ${TOKENS.valid}`,
      });

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(ctx.request.user).toEqual(JWT_PAYLOAD);
    });
  });

  describe('missing/malformed auth header', () => {
    it('throws UnauthorizedException when Authorization header missing', async () => {
      const ctx = makeExecutionContext();

      await expect(guard.canActivate(ctx)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when scheme is not Bearer', async () => {
      const ctx = makeExecutionContext({
        authorization: `Basic ${TOKENS.valid}`,
      });

      await expect(guard.canActivate(ctx)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when token is missing after Bearer', async () => {
      const ctx = makeExecutionContext({ authorization: 'Bearer' });

      await expect(guard.canActivate(ctx)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });
  });

  describe('invalid/expired token', () => {
    it('throws UnauthorizedException on expired token', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));
      const ctx = makeExecutionContext({
        authorization: `Bearer ${TOKENS.expired}`,
      });

      await expect(guard.canActivate(ctx)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException on malformed token', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));
      const ctx = makeExecutionContext({
        authorization: `Bearer ${TOKENS.malformed}`,
      });

      await expect(guard.canActivate(ctx)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
