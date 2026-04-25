export const TEST_USER = {
  id: 'user-1',
  login: 'john',
  password: 'hashed-pass',
};

export const TEST_ARTICLE = {
  id: 'article-1',
  title: 'Test Article',
  content: 'Test content',
};

export const TOKENS = {
  access: 'access-token',
  refresh: 'refresh-token',
  valid: 'valid-token',
  expired: 'expired-token',
  revoked: 'revoked-token',
  malformed: 'malformed-token',
} as const;
