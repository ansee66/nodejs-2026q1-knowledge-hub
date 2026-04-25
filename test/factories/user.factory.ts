import { UserRole } from '@prisma/client';
import { TEST_USER } from '../constants';

export const USER_FACTORY_DEFAULTS = {
  id: TEST_USER.id,
  login: TEST_USER.login,
  password: TEST_USER.password,
  role: UserRole.viewer,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
} as const;

export const makePrismaUser = (overrides = {}) => ({
  ...USER_FACTORY_DEFAULTS,
  ...overrides,
});
