import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { ArticleService } from './article.service';
import { CommentService } from '../comment/comment.service';
import { PrismaService } from '../../prisma/prisma.service';

import { makePrismaMock } from '../../../test/mocks/prisma.mock';
import {
  makePrismaArticle,
  makePrismaArticleWithTags,
} from '../../../test/factories/article.factory';

import { ArticleStatus, UserRole } from '@prisma/client';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { TEST_ARTICLE, TEST_USER } from '../../../test/constants';

const MISSING_ID = 'missing-id';
const OTHER_USER_ID = 'other-user';
const CATEGORY_ID = 'category-1';

const makeAdminUser = (overrides = {}): JwtPayload => ({
  userId: TEST_USER.id,
  login: 'admin',
  role: UserRole.admin,
  ...overrides,
});

const makeEditorUser = (overrides = {}): JwtPayload => ({
  userId: TEST_USER.id,
  login: 'editor',
  role: UserRole.editor,
  ...overrides,
});

const BASE_CREATE_DTO = {
  title: 'Test Article',
  content: 'Test content',
  status: ArticleStatus.draft,
  tags: [],
} as const;

describe('ArticleService', () => {
  let service: ArticleService;
  let prisma: ReturnType<typeof makePrismaMock>;

  const commentServiceMock = {
    deleteByArticleId: vi.fn(),
  };

  beforeEach(async () => {
    prisma = makePrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        { provide: PrismaService, useValue: prisma },
        { provide: CommentService, useValue: commentServiceMock },
      ],
    }).compile();

    service = module.get(ArticleService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns all articles with numeric timestamps', async () => {
      prisma.article.findMany.mockResolvedValue([
        makePrismaArticle(),
        makePrismaArticle({ id: 'article-2' }),
      ]);

      const result = await service.findAll({});

      expect(result).toHaveLength(2);
      expect(result[0].createdAt).toBeTypeOf('number');
      expect(result[0].updatedAt).toBeTypeOf('number');
    });

    it('filters by status', async () => {
      prisma.article.findMany.mockResolvedValue([
        makePrismaArticle({ status: ArticleStatus.published }),
      ]);

      await service.findAll({ status: ArticleStatus.published });

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: ArticleStatus.published }),
        }),
      );
    });

    it('filters by categoryId', async () => {
      prisma.article.findMany.mockResolvedValue([]);

      await service.findAll({ categoryId: CATEGORY_ID });

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: CATEGORY_ID }),
        }),
      );
    });

    it('filters by tag', async () => {
      prisma.article.findMany.mockResolvedValue([]);

      await service.findAll({ tag: 'nestjs' });

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tags: { some: { name: 'nestjs' } },
          }),
        }),
      );
    });

    it('returns empty array when no articles found', async () => {
      prisma.article.findMany.mockResolvedValue([]);

      const result = await service.findAll({});

      expect(result).toEqual([]);
    });

    it('maps tags to array of strings', async () => {
      prisma.article.findMany.mockResolvedValue([
        makePrismaArticleWithTags(['nestjs', 'typescript']),
      ]);

      const result = await service.findAll({});

      expect(result[0].tags).toEqual(['nestjs', 'typescript']);
    });
  });

  describe('findById', () => {
    it('returns article when found', async () => {
      prisma.article.findUnique.mockResolvedValue(makePrismaArticle());

      const result = await service.findById(TEST_ARTICLE.id);

      expect(result.id).toBe(TEST_ARTICLE.id);
    });

    it('throws NotFoundException when article missing', async () => {
      prisma.article.findUnique.mockResolvedValue(null);

      await expect(service.findById(MISSING_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── create ────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('creates article with draft status by default', async () => {
      const dto = { ...BASE_CREATE_DTO, status: undefined, tags: [] };
      prisma.article.create.mockResolvedValue(makePrismaArticle());

      const result = await service.create(dto as any, makeAdminUser());

      expect(result.status).toBe(ArticleStatus.draft);
    });

    it('creates article with tags', async () => {
      const tags = ['nestjs', 'typescript'];
      prisma.article.create.mockResolvedValue(makePrismaArticleWithTags(tags));

      const result = await service.create(
        { ...BASE_CREATE_DTO, tags },
        makeAdminUser(),
      );

      expect(result.tags).toEqual(tags);
    });

    it('editor creates article with own authorId', async () => {
      const editor = makeEditorUser();
      prisma.article.create.mockResolvedValue(
        makePrismaArticle({ authorId: TEST_USER.id }),
      );

      const result = await service.create(
        { ...BASE_CREATE_DTO, authorId: OTHER_USER_ID },
        editor,
      );

      // editor не может назначить другого автора — всегда себя
      expect(prisma.article.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ authorId: TEST_USER.id }),
        }),
      );
      expect(result.authorId).toBe(TEST_USER.id);
    });

    it('admin can set custom authorId', async () => {
      prisma.article.create.mockResolvedValue(
        makePrismaArticle({ authorId: OTHER_USER_ID }),
      );

      await service.create(
        { ...BASE_CREATE_DTO, authorId: OTHER_USER_ID },
        makeAdminUser(),
      );

      expect(prisma.article.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ authorId: OTHER_USER_ID }),
        }),
      );
    });
  });

  // ── update ────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('updates article when user is owner', async () => {
      prisma.article.findUnique.mockResolvedValue(
        makePrismaArticle({ authorId: TEST_USER.id }),
      );
      prisma.article.update.mockResolvedValue(
        makePrismaArticle({ title: 'Updated' }),
      );

      const result = await service.update(
        TEST_ARTICLE.id,
        { title: 'Updated' },
        makeEditorUser(),
      );

      expect(result.title).toBe('Updated');
    });

    it('throws ForbiddenException when editor updates another user article', async () => {
      prisma.article.findUnique.mockResolvedValue(
        makePrismaArticle({ authorId: OTHER_USER_ID }),
      );

      await expect(
        service.update(TEST_ARTICLE.id, { title: 'Hack' }, makeEditorUser()),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.article.update).not.toHaveBeenCalled();
    });

    it('admin can update any article', async () => {
      prisma.article.findUnique.mockResolvedValue(
        makePrismaArticle({ authorId: OTHER_USER_ID }),
      );
      prisma.article.update.mockResolvedValue(makePrismaArticle());

      await expect(
        service.update(
          TEST_ARTICLE.id,
          { title: 'Admin edit' },
          makeAdminUser(),
        ),
      ).resolves.not.toThrow();
    });

    it('throws NotFoundException when article missing', async () => {
      prisma.article.findUnique.mockResolvedValue(null);

      await expect(
        service.update(MISSING_ID, { title: 'x' }, makeAdminUser()),
      ).rejects.toThrow(NotFoundException);
    });

    // ── статусные переходы ─────────────────────────────────────────────────
    it('transitions status from draft to published', async () => {
      prisma.article.findUnique.mockResolvedValue(
        makePrismaArticle({ status: ArticleStatus.draft }),
      );
      prisma.article.update.mockResolvedValue(
        makePrismaArticle({ status: ArticleStatus.published }),
      );

      const result = await service.update(
        TEST_ARTICLE.id,
        { status: ArticleStatus.published },
        makeAdminUser(),
      );

      expect(result.status).toBe(ArticleStatus.published);
    });

    it('transitions status from published to archived', async () => {
      prisma.article.findUnique.mockResolvedValue(
        makePrismaArticle({ status: ArticleStatus.published }),
      );
      prisma.article.update.mockResolvedValue(
        makePrismaArticle({ status: ArticleStatus.archived }),
      );

      const result = await service.update(
        TEST_ARTICLE.id,
        { status: ArticleStatus.archived },
        makeAdminUser(),
      );

      expect(result.status).toBe(ArticleStatus.archived);
    });
  });

  describe('delete', () => {
    it('deletes article when user is owner', async () => {
      prisma.article.findUnique.mockResolvedValue(
        makePrismaArticle({ authorId: TEST_USER.id }),
      );
      prisma.article.delete.mockResolvedValue({});

      await service.delete(TEST_ARTICLE.id, makeEditorUser());

      expect(prisma.article.delete).toHaveBeenCalledWith({
        where: { id: TEST_ARTICLE.id },
      });
    });

    it('throws ForbiddenException when editor deletes another user article', async () => {
      prisma.article.findUnique.mockResolvedValue(
        makePrismaArticle({ authorId: OTHER_USER_ID }),
      );

      await expect(
        service.delete(TEST_ARTICLE.id, makeEditorUser()),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.article.delete).not.toHaveBeenCalled();
    });

    it('admin can delete any article', async () => {
      prisma.article.findUnique.mockResolvedValue(
        makePrismaArticle({ authorId: OTHER_USER_ID }),
      );
      prisma.article.delete.mockResolvedValue({});

      await expect(
        service.delete(TEST_ARTICLE.id, makeAdminUser()),
      ).resolves.not.toThrow();
    });

    it('throws NotFoundException when article missing', async () => {
      prisma.article.findUnique.mockResolvedValue(null);

      await expect(service.delete(MISSING_ID, makeAdminUser())).rejects.toThrow(
        NotFoundException,
      );

      expect(prisma.article.delete).not.toHaveBeenCalled();
    });
  });
});
