import { of } from 'rxjs';
import { ExcludePasswordInterceptor } from './exclude-password';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import {
  makePrismaUser,
  USER_FACTORY_DEFAULTS,
} from '../../../test/factories/user.factory';

const makeCallHandler = (data: unknown): CallHandler => ({
  handle: () => of(data),
});

const makeExecutionContext = () => ({}) as ExecutionContext;

const runInterceptor = (data: unknown): Promise<unknown> => {
  const interceptor = new ExcludePasswordInterceptor();
  const ctx = makeExecutionContext();
  const handler = makeCallHandler(data);

  return new Promise((resolve) => {
    interceptor.intercept(ctx, handler).subscribe(resolve);
  });
};

describe('ExcludePasswordInterceptor', () => {
  describe('single object', () => {
    it('removes password field from response', async () => {
      const user = makePrismaUser();
      const result = (await runInterceptor(user)) as Record<string, unknown>;

      expect(result).not.toHaveProperty('password');
    });

    it('preserves all other fields', async () => {
      const user = makePrismaUser();
      const result = (await runInterceptor(user)) as Record<string, unknown>;

      expect(result).toMatchObject({
        id: USER_FACTORY_DEFAULTS.id,
        login: USER_FACTORY_DEFAULTS.login,
        role: USER_FACTORY_DEFAULTS.role,
      });
    });
  });

  describe('array of objects', () => {
    it('removes password from every item', async () => {
      const users = [makePrismaUser(), makePrismaUser({ id: 'user-2' })];
      const result = (await runInterceptor(users)) as Record<string, unknown>[];

      expect(result).toHaveLength(2);
      result.forEach((item) => {
        expect(item).not.toHaveProperty('password');
      });
    });

    it('preserves other fields in every item', async () => {
      const users = [
        makePrismaUser(),
        makePrismaUser({ id: 'user-2', login: 'jane' }),
      ];
      const result = (await runInterceptor(users)) as Record<string, unknown>[];

      expect(result[0].login).toBe(USER_FACTORY_DEFAULTS.login);
      expect(result[1].login).toBe('jane');
    });
  });

  describe('edge cases', () => {
    it('returns null as-is', async () => {
      const result = await runInterceptor(null);
      expect(result).toBeNull();
    });

    it('returns undefined as-is', async () => {
      const result = await runInterceptor(undefined);
      expect(result).toBeUndefined();
    });

    it('handles object without password field correctly', async () => {
      const data = {
        id: USER_FACTORY_DEFAULTS.id,
        login: USER_FACTORY_DEFAULTS.login,
      };
      const result = (await runInterceptor(data)) as Record<string, unknown>;

      expect(result).toEqual(data);
    });
  });
});
