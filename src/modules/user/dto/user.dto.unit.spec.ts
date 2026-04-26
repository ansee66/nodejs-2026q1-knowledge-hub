import { CreateUserDto } from './create-user.dto';
import { UpdatePasswordDto } from './update-password.dto';
import { UserRole } from '@prisma/client';
import { TEST_USER } from '../../../../test/constants';
import { validateDto } from '../../../../test/utils/validateDto';

describe('CreateUserDto', () => {
  describe('valid payload', () => {
    it('passes with login and password', async () => {
      const errors = await validateDto(CreateUserDto, {
        login: TEST_USER.login,
        password: TEST_USER.password,
      });

      expect(errors).toHaveLength(0);
    });

    it('passes with optional role provided', async () => {
      const errors = await validateDto(CreateUserDto, {
        login: TEST_USER.login,
        password: TEST_USER.password,
        role: UserRole.admin,
      });

      expect(errors).toHaveLength(0);
    });
  });

  describe('missing required fields', () => {
    it('fails when both login and password are missing', async () => {
      const errors = await validateDto(CreateUserDto, {});

      expect(errors).toHaveLength(2);
    });

    it('fails when login is missing', async () => {
      const errors = await validateDto(CreateUserDto, {
        password: TEST_USER.password,
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('login');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('fails when password is missing', async () => {
      const errors = await validateDto(CreateUserDto, {
        login: TEST_USER.login,
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isString');
    });
  });

  describe('invalid field types', () => {
    it('fails when login is not a string', async () => {
      const errors = await validateDto(CreateUserDto, {
        login: 123,
        password: TEST_USER.password,
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('login');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('fails when password is not a string', async () => {
      const errors = await validateDto(CreateUserDto, {
        login: TEST_USER.login,
        password: 123,
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isString');
    });
  });

  describe('invalid enum value', () => {
    it('fails when role is invalid enum value', async () => {
      const errors = await validateDto(CreateUserDto, {
        login: TEST_USER.login,
        password: TEST_USER.password,
        role: 'superuser',
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('role');
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('passes for each valid role value', async () => {
      for (const role of Object.values(UserRole)) {
        const errors = await validateDto(CreateUserDto, {
          login: TEST_USER.login,
          password: TEST_USER.password,
          role,
        });

        expect(errors).toHaveLength(0);
      }
    });
  });
});

describe('UpdatePasswordDto', () => {
  describe('valid payload', () => {
    it('passes with oldPassword and newPassword', async () => {
      const errors = await validateDto(UpdatePasswordDto, {
        oldPassword: TEST_USER.password,
        newPassword: 'new-password',
      });

      expect(errors).toHaveLength(0);
    });
  });

  describe('missing required fields', () => {
    it('fails when both fields are missing', async () => {
      const errors = await validateDto(UpdatePasswordDto, {});

      expect(errors).toHaveLength(2);
    });

    it('fails when oldPassword is missing', async () => {
      const errors = await validateDto(UpdatePasswordDto, {
        newPassword: 'new-password',
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('oldPassword');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('fails when newPassword is missing', async () => {
      const errors = await validateDto(UpdatePasswordDto, {
        oldPassword: TEST_USER.password,
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('newPassword');
      expect(errors[0].constraints).toHaveProperty('isString');
    });
  });

  describe('invalid field types', () => {
    it('fails when oldPassword is not a string', async () => {
      const errors = await validateDto(UpdatePasswordDto, {
        oldPassword: 123,
        newPassword: 'new-password',
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('oldPassword');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('fails when newPassword is not a string', async () => {
      const errors = await validateDto(UpdatePasswordDto, {
        oldPassword: TEST_USER.password,
        newPassword: true,
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('newPassword');
      expect(errors[0].constraints).toHaveProperty('isString');
    });
  });
});
