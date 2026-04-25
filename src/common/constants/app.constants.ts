import 'dotenv/config';

export const APP_CONFIG = {
  PORT: 4000,
  SWAGGER: {
    PATH: 'doc',
    TITLE: 'Knowledge Hub API',
    VERSION: '1.0',
  },
};

export const CRYPT_SALT = Number.isFinite(Number(process.env.CRYPT_SALT))
  ? Number(process.env.CRYPT_SALT)
  : 10;
