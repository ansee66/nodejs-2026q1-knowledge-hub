import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { RolesGuard } from './roles.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { TEST_USER } from '../../../../test/constants';

const OTHER_USER_ID = 'other-user';

const makeUser = (role: UserRole, id = TEST_USER.id) => ({
  userId: id,
  login: 'john',
  role,
  id,
});

const makeReflector = ({
  isPublic = false,
  requiredRoles = undefined as UserRole[] | undefined,
} = {}) => ({
  getAllAndOverride: vi.fn().mockImplementation((key: string) => {
    if (key === IS_PUBLIC_KEY) return isPublic;
    if (key === ROLES_KEY) return requiredRoles;
    return undefined;
  }),
});

const makeExecutionContext = ({
  user = undefined,
  method = 'GET',
  params = {} as Record<string, string>,
} = {}) => {
  const request = { user, method, params };
  return {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: vi.fn().mockReturnValue({
      getRequest: vi.fn().mockReturnValue(request),
    }),
  } as unknown as ExecutionContext;
};

describe('RolesGuard', () => {
  let guard: RolesGuard;

  const buildGuard = (reflectorOptions = {}) => {
    const reflector = makeReflector(reflectorOptions);
    return new RolesGuard(reflector as unknown as Reflector);
  };

  afterEach(() => vi.clearAllMocks());

  describe('public routes', () => {
    it('allows access for @Public() routes regardless of role', () => {
      guard = buildGuard({ isPublic: true });
      const ctx = makeExecutionContext({ user: undefined });

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('unauthenticated request', () => {
    it('returns false when no user in request', () => {
      guard = buildGuard();
      const ctx = makeExecutionContext({ user: undefined });

      expect(guard.canActivate(ctx)).toBe(false);
    });
  });

  describe('admin role', () => {
    it('allows admin access to any route regardless of required roles', () => {
      guard = buildGuard({ requiredRoles: [UserRole.editor] });
      const ctx = makeExecutionContext({ user: makeUser(UserRole.admin) });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('allows admin to DELETE', () => {
      guard = buildGuard({ requiredRoles: [UserRole.admin] });
      const ctx = makeExecutionContext({
        user: makeUser(UserRole.admin),
        method: 'DELETE',
      });

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('missing @Roles() metadata', () => {
    it('allows any authenticated user when no roles required', () => {
      guard = buildGuard({ requiredRoles: undefined });
      const ctx = makeExecutionContext({ user: makeUser(UserRole.viewer) });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('allows editor when no roles required', () => {
      guard = buildGuard({ requiredRoles: [] });
      const ctx = makeExecutionContext({ user: makeUser(UserRole.editor) });

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('viewer role', () => {
    it('allows viewer on route without role restrictions', () => {
      guard = buildGuard({ requiredRoles: undefined });
      const ctx = makeExecutionContext({ user: makeUser(UserRole.viewer) });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('throws ForbiddenException when viewer tries restricted route', () => {
      guard = buildGuard({ requiredRoles: [UserRole.admin, UserRole.editor] });
      const ctx = makeExecutionContext({ user: makeUser(UserRole.viewer) });

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });

  describe('editor role', () => {
    it('allows editor on route requiring editor role', () => {
      guard = buildGuard({ requiredRoles: [UserRole.editor] });
      const ctx = makeExecutionContext({ user: makeUser(UserRole.editor) });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('throws ForbiddenException when editor tries admin-only route', () => {
      guard = buildGuard({ requiredRoles: [UserRole.admin] });
      const ctx = makeExecutionContext({ user: makeUser(UserRole.editor) });

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });

  describe('own password update exception', () => {
    it('allows viewer to PUT own password', () => {
      guard = buildGuard({ requiredRoles: [UserRole.admin] });
      const ctx = makeExecutionContext({
        user: makeUser(UserRole.viewer, TEST_USER.id),
        method: 'PUT',
        params: { id: TEST_USER.id },
      });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('throws ForbiddenException when viewer tries PUT on another user', () => {
      guard = buildGuard({ requiredRoles: [UserRole.admin] });
      const ctx = makeExecutionContext({
        user: makeUser(UserRole.viewer, TEST_USER.id),
        method: 'PUT',
        params: { id: OTHER_USER_ID },
      });

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });
});
