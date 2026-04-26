import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import { CommentService } from './comment.service';
import { ArticleService } from '../article/article.service';
import { PrismaService } from '../../prisma/prisma.service';

import { makePrismaMock } from '../../../test/mocks/prisma.mock';
import {
  makePrismaComment,
  COMMENT_FACTORY_DEFAULTS,
} from '../../../test/factories/comment.factory';

import { UserRole } from '@prisma/client';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { TEST_ARTICLE, TEST_USER } from '../../../test/constants';

const COMMENT_ID = COMMENT_FACTORY_DEFAULTS.id;
const OTHER_USER_ID = 'other-user';
const MISSING_ID = 'missing-id';

const makeEditorUser = (overrides = {}): JwtPayload => ({
  userId: TEST_USER.id,
  login: 'editor',
  role: UserRole.editor,
  ...overrides,
});

const makeAdminUser = (overrides = {}): JwtPayload => ({
  userId: TEST_USER.id,
  login: 'admin',
  role: UserRole.admin,
  ...overrides,
});

const BASE_CREATE_DTO = {
  content: COMMENT_FACTORY_DEFAULTS.content,
  articleId: TEST_ARTICLE.id,
};

describe('CommentService', () => {
  let service: CommentService;
  let prisma: ReturnType<typeof makePrismaMock>;
  let articleService: { findById: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    prisma = makePrismaMock();
    articleService = { findById: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        { provide: PrismaService, useValue: prisma },
        { provide: ArticleService, useValue: articleService },
      ],
    }).compile();

    service = module.get(CommentService);
  });

  afterEach(() => vi.clearAllMocks());

  describe('findAll', () => {
    it('returns comments with numeric timestamps', async () => {
      prisma.comment.findMany.mockResolvedValue([
        makePrismaComment(),
        makePrismaComment({ id: 'comment-2' }),
      ]);

      const result = await service.findAll({ articleId: TEST_ARTICLE.id });

      expect(result).toHaveLength(2);
      expect(result[0].createdAt).toBeTypeOf('number');
    });

    it('filters by articleId', async () => {
      prisma.comment.findMany.mockResolvedValue([]);

      await service.findAll({ articleId: TEST_ARTICLE.id });

      expect(prisma.comment.findMany).toHaveBeenCalledWith({
        where: { articleId: TEST_ARTICLE.id },
      });
    });
  });

  describe('findById', () => {
    it('returns comment when found', async () => {
      prisma.comment.findUnique.mockResolvedValue(makePrismaComment());

      const result = await service.findById(COMMENT_ID);

      expect(result.id).toBe(COMMENT_ID);
    });

    it('throws NotFoundException when comment missing', async () => {
      prisma.comment.findUnique.mockResolvedValue(null);

      await expect(service.findById(MISSING_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates comment when article exists', async () => {
      articleService.findById.mockResolvedValue({ id: TEST_ARTICLE.id });
      prisma.comment.create.mockResolvedValue(makePrismaComment());

      const result = await service.create(BASE_CREATE_DTO, makeAdminUser());

      expect(result.id).toBe(COMMENT_ID);
      expect(result.createdAt).toBeTypeOf('number');
    });

    it('throws UnprocessableEntityException when article not found', async () => {
      articleService.findById.mockRejectedValue(new NotFoundException());

      await expect(
        service.create(BASE_CREATE_DTO, makeAdminUser()),
      ).rejects.toThrow(UnprocessableEntityException);

      expect(prisma.comment.create).not.toHaveBeenCalled();
    });

    it('editor creates comment with own authorId', async () => {
      articleService.findById.mockResolvedValue({ id: TEST_ARTICLE.id });
      prisma.comment.create.mockResolvedValue(
        makePrismaComment({ authorId: TEST_USER.id }),
      );

      await service.create(
        { ...BASE_CREATE_DTO, authorId: OTHER_USER_ID },
        makeEditorUser(),
      );

      expect(prisma.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ authorId: TEST_USER.id }),
        }),
      );
    });

    it('admin can set custom authorId', async () => {
      articleService.findById.mockResolvedValue({ id: TEST_ARTICLE.id });
      prisma.comment.create.mockResolvedValue(
        makePrismaComment({ authorId: OTHER_USER_ID }),
      );

      await service.create(
        { ...BASE_CREATE_DTO, authorId: OTHER_USER_ID },
        makeAdminUser(),
      );

      expect(prisma.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ authorId: OTHER_USER_ID }),
        }),
      );
    });
  });

  describe('delete', () => {
    it('deletes comment when editor owns it', async () => {
      prisma.comment.findUnique.mockResolvedValue(
        makePrismaComment({ authorId: TEST_USER.id }),
      );
      prisma.comment.delete.mockResolvedValue({});

      await service.delete(COMMENT_ID, makeEditorUser());

      expect(prisma.comment.delete).toHaveBeenCalledWith({
        where: { id: COMMENT_ID },
      });
    });

    it('throws ForbiddenException when editor deletes another user comment', async () => {
      prisma.comment.findUnique.mockResolvedValue(
        makePrismaComment({ authorId: OTHER_USER_ID }),
      );

      await expect(
        service.delete(COMMENT_ID, makeEditorUser()),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.comment.delete).not.toHaveBeenCalled();
    });

    it('admin can delete any comment', async () => {
      prisma.comment.findUnique.mockResolvedValue(
        makePrismaComment({ authorId: OTHER_USER_ID }),
      );
      prisma.comment.delete.mockResolvedValue({});

      await expect(
        service.delete(COMMENT_ID, makeAdminUser()),
      ).resolves.not.toThrow();

      expect(prisma.comment.delete).toHaveBeenCalled();
    });

    it('throws NotFoundException when comment missing', async () => {
      prisma.comment.findUnique.mockResolvedValue(null);

      await expect(service.delete(MISSING_ID, makeAdminUser())).rejects.toThrow(
        NotFoundException,
      );

      expect(prisma.comment.delete).not.toHaveBeenCalled();
    });
  });
});
