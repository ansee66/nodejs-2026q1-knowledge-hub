import { validateDto } from '../../../../test/utils/validateDto';
import { CreateArticleDto } from './create-article.dto';
import { ArticleStatus } from '@prisma/client';
import { TEST_ARTICLE, TEST_USER } from '../../../../test/constants';

describe('CreateArticleDto', () => {
  const VALID_PAYLOAD = {
    title: TEST_ARTICLE.id,
    content: TEST_ARTICLE.content,
    status: ArticleStatus.draft,
    tags: [],
  };

  describe('valid payload', () => {
    it('passes with all required fields', async () => {
      const errors = await validateDto(CreateArticleDto, VALID_PAYLOAD);
      expect(errors).toHaveLength(0);
    });

    it('passes with optional authorId', async () => {
      const errors = await validateDto(CreateArticleDto, {
        ...VALID_PAYLOAD,
        authorId: TEST_USER.id,
      });
      expect(errors).toHaveLength(0);
    });

    it('passes with tags array', async () => {
      const errors = await validateDto(CreateArticleDto, {
        ...VALID_PAYLOAD,
        tags: ['nestjs', 'typescript'],
      });
      expect(errors).toHaveLength(0);
    });

    it('passes for each valid status value', async () => {
      for (const status of Object.values(ArticleStatus)) {
        const errors = await validateDto(CreateArticleDto, {
          ...VALID_PAYLOAD,
          status,
        });
        expect(errors).toHaveLength(0);
      }
    });
  });

  describe('missing required fields', () => {
    it('fails when title is missing', async () => {
      const { title: _, ...rest } = VALID_PAYLOAD;
      const errors = await validateDto(CreateArticleDto, rest);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('title');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('fails when content is missing', async () => {
      const { content: _, ...rest } = VALID_PAYLOAD;
      const errors = await validateDto(CreateArticleDto, rest);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('content');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('fails when status is missing', async () => {
      const { status: _, ...rest } = VALID_PAYLOAD;
      const errors = await validateDto(CreateArticleDto, rest);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('status');
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('fails when tags is missing', async () => {
      const { tags: _, ...rest } = VALID_PAYLOAD;
      const errors = await validateDto(CreateArticleDto, rest);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('tags');
      expect(errors[0].constraints).toHaveProperty('isArray');
    });
  });

  describe('invalid field types', () => {
    it('fails when title is not a string', async () => {
      const errors = await validateDto(CreateArticleDto, {
        ...VALID_PAYLOAD,
        title: 123,
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('title');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('fails when content is not a string', async () => {
      const errors = await validateDto(CreateArticleDto, {
        ...VALID_PAYLOAD,
        content: 123,
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('content');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('fails when tags is not an array', async () => {
      const errors = await validateDto(CreateArticleDto, {
        ...VALID_PAYLOAD,
        tags: 'nestjs',
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('tags');
      expect(errors[0].constraints).toHaveProperty('isArray');
    });

    it('fails when tags contains non-string values', async () => {
      const errors = await validateDto(CreateArticleDto, {
        ...VALID_PAYLOAD,
        tags: [1, 2, 3],
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('tags');
      expect(errors[0].constraints).toHaveProperty('isString');
    });
  });

  describe('invalid enum value', () => {
    it('fails when status is invalid enum value', async () => {
      const errors = await validateDto(CreateArticleDto, {
        ...VALID_PAYLOAD,
        status: 'invalid-status',
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('status');
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });
  });
});
