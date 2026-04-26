import { TEST_ARTICLE, TEST_USER } from '../constants';

export const COMMENT_FACTORY_DEFAULTS = {
  id: 'comment-1',
  content: 'Test comment',
  articleId: TEST_ARTICLE.id,
  authorId: TEST_USER.id,
  createdAt: new Date('2026-01-01'),
} as const;

export const makePrismaComment = (overrides = {}) => ({
  ...COMMENT_FACTORY_DEFAULTS,
  ...overrides,
});
