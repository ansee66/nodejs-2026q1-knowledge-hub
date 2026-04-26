import { ArticleStatus } from '@prisma/client';
import { TEST_ARTICLE, TEST_USER } from '../constants';

export const ARTICLE_FACTORY_DEFAULTS = {
  id: TEST_ARTICLE.id,
  title: TEST_ARTICLE.title,
  content: TEST_ARTICLE.content,
  status: ArticleStatus.draft,
  authorId: TEST_USER.id,
  categoryId: null,
  tags: [],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
} as const;

export const makePrismaArticle = (overrides = {}) => ({
  ...ARTICLE_FACTORY_DEFAULTS,
  tags: [],
  ...overrides,
});

export const makePrismaArticleWithTags = (tagNames: string[], overrides = {}) => ({
  ...ARTICLE_FACTORY_DEFAULTS,
  tags: tagNames.map((name) => ({ id: `tag-${name}`, name })),
  ...overrides,
});
