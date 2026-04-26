import { TEST_USER } from '../../../../test/constants';
import { validateDto } from '../../../../test/utils/validateDto';
import { SignupDto } from './signup.dto';
import { LogoutDto } from './logout.dto';

describe('SignupDto / LoginDto', () => {
  describe('valid payload', () => {
    it('passes with login and password', async () => {
      const errors = await validateDto(SignupDto, {
        login: TEST_USER.login,
        password: TEST_USER.password,
      });

      expect(errors).toHaveLength(0);
    });
  });

  describe('missing required fields', () => {
    it('fails when both login and password are missing', async () => {
      const errors = await validateDto(SignupDto, {});

      expect(errors).toHaveLength(2);
    });

    it('fails when login is missing', async () => {
      const errors = await validateDto(SignupDto, {
        password: TEST_USER.password,
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('login');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('fails when password is missing', async () => {
      const errors = await validateDto(SignupDto, {
        login: TEST_USER.login,
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isString');
    });
  });

  describe('invalid field types', () => {
    it('fails when login is not a string', async () => {
      const errors = await validateDto(SignupDto, {
        login: 123,
        password: TEST_USER.password,
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('login');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('fails when password is not a string', async () => {
      const errors = await validateDto(SignupDto, {
        login: TEST_USER.login,
        password: 123,
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isString');
    });
  });
});

describe('LogoutDto', () => {
  describe('valid payload', () => {
    it('passes with refreshToken', async () => {
      const errors = await validateDto(LogoutDto, {
        refreshToken: 'some-refresh-token',
      });

      expect(errors).toHaveLength(0);
    });
  });

  describe('invalid payload', () => {
    it('fails when refreshToken is missing', async () => {
      const errors = await validateDto(LogoutDto, {});

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('refreshToken');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('fails when refreshToken is not a string', async () => {
      const errors = await validateDto(LogoutDto, {
        refreshToken: 123,
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('refreshToken');
      expect(errors[0].constraints).toHaveProperty('isString');
    });
  });
});
