import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UserService } from './user.service';
import { PrismaService } from '../../prisma/prisma.service';

import { makePrismaMock } from '../../../test/mocks/prisma.mock';
import { makePrismaUser } from '../../../test/factories/user.factory';

import { UserRole } from '@prisma/client';
import { TEST_USER } from '../../../test/constants';

const MISSING_ID = 'missing';

const PASSWORDS = {
  plain: '123456',
  hashed: 'hashed123',
  old: 'old',
  new: 'new',
  wrong: 'wrong',
  newHashed: 'new-hash',
} as const;

const CREATE_DTO = {
  default: { login: TEST_USER.login, password: PASSWORDS.plain },
  withAdminRole: {
    login: 'admin',
    password: PASSWORDS.plain,
    role: UserRole.admin,
  },
} as const;

const UPDATE_PASSWORD_DTO = {
  valid: { oldPassword: PASSWORDS.old, newPassword: PASSWORDS.new },
  wrong: { oldPassword: PASSWORDS.wrong, newPassword: PASSWORDS.new },
  any: { oldPassword: '1', newPassword: '2' },
} as const;

vi.mock('bcrypt', () => ({
  hash: vi.fn<() => Promise<string>>(),
  compare: vi.fn<() => Promise<boolean>>(),
}));

describe('UserService', () => {
  let service: UserService;
  let prisma: ReturnType<typeof makePrismaMock>;

  beforeEach(async () => {
    prisma = makePrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(UserService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns users with numeric timestamps', async () => {
      prisma.user.findMany.mockResolvedValue([
        makePrismaUser(),
        makePrismaUser({ id: '2' }),
      ]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].createdAt).toBeTypeOf('number');
      expect(result[0].updatedAt).toBeTypeOf('number');
    });
  });

  describe('findById', () => {
    it('returns user when found', async () => {
      prisma.user.findUnique.mockResolvedValue(makePrismaUser());

      const result = await service.findById(TEST_USER.id);

      expect(result.id).toBe(TEST_USER.id);
    });

    it('throws NotFoundException when user missing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById(MISSING_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByLogin', () => {
    it('returns user when found', async () => {
      prisma.user.findUnique.mockResolvedValue(makePrismaUser());

      const result = await service.findByLogin(CREATE_DTO.default.login);

      expect(result.login).toBe(CREATE_DTO.default.login);
    });

    it('returns null when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findByLogin(MISSING_ID);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates user with hashed password', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValue(PASSWORDS.hashed);
      prisma.user.create.mockResolvedValue(
        makePrismaUser({ password: PASSWORDS.hashed }),
      );

      const result = await service.create(CREATE_DTO.default);

      expect(bcrypt.hash).toHaveBeenCalledWith(
        PASSWORDS.plain,
        expect.any(Number),
      );
      expect(result.password).toBe(PASSWORDS.hashed);
    });

    it('uses viewer role by default', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValue(PASSWORDS.hashed);
      prisma.user.create.mockResolvedValue(makePrismaUser());

      const result = await service.create(CREATE_DTO.default);

      expect(result.role).toBe(UserRole.viewer);
    });

    it('uses provided role', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValue(PASSWORDS.hashed);
      prisma.user.create.mockResolvedValue(
        makePrismaUser({ role: UserRole.admin }),
      );

      const result = await service.create(CREATE_DTO.withAdminRole);

      expect(result.role).toBe(UserRole.admin);
    });
  });

  describe('updatePassword', () => {
    it('updates password when old password correct', async () => {
      prisma.user.findUnique.mockResolvedValue(makePrismaUser());
      vi.mocked(bcrypt.compare).mockResolvedValue(true);
      vi.mocked(bcrypt.hash).mockResolvedValue(PASSWORDS.newHashed);
      prisma.user.update.mockResolvedValue(
        makePrismaUser({ password: PASSWORDS.newHashed }),
      );

      const result = await service.updatePassword(
        TEST_USER.id,
        UPDATE_PASSWORD_DTO.valid,
      );

      expect(bcrypt.hash).toHaveBeenCalledWith(
        PASSWORDS.new,
        expect.any(Number),
      );
      expect(result.password).toBe(PASSWORDS.newHashed);
    });

    it('throws ForbiddenException when old password wrong', async () => {
      prisma.user.findUnique.mockResolvedValue(makePrismaUser());
      vi.mocked(bcrypt.compare).mockResolvedValue(false);

      await expect(
        service.updatePassword(TEST_USER.id, UPDATE_PASSWORD_DTO.wrong),
      ).rejects.toThrow(ForbiddenException);
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when user missing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePassword(MISSING_ID, UPDATE_PASSWORD_DTO.any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('deletes existing user', async () => {
      prisma.user.findUnique.mockResolvedValue(makePrismaUser());
      prisma.user.delete.mockResolvedValue({});

      await service.delete(TEST_USER.id);

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: TEST_USER.id },
      });
    });

    it('throws if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.delete(MISSING_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });
  });
});
