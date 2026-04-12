import 'dotenv/config';
import { PrismaClient, UserRole, ArticleStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL']!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const admin = await prisma.user.create({
    data: {
      login: 'admin',
      password: '123',
      role: UserRole.ADMIN,
    },
  });

  const editor = await prisma.user.create({
    data: {
      login: 'editor',
      password: '123',
      role: UserRole.EDITOR,
    },
  });

  const tech = await prisma.category.create({
    data: { name: 'Tech', description: 'Tech articles' },
  });

  const science = await prisma.category.create({
    data: { name: 'Science', description: 'Science articles' },
  });

  const life = await prisma.category.create({
    data: { name: 'Life', description: 'Life articles' },
  });

  const tags = await Promise.all([
    prisma.tag.create({ data: { name: 'nestjs' } }),
    prisma.tag.create({ data: { name: 'docker' } }),
    prisma.tag.create({ data: { name: 'prisma' } }),
    prisma.tag.create({ data: { name: 'backend' } }),
    prisma.tag.create({ data: { name: 'api' } }),
  ]);

  const article1 = await prisma.article.create({
    data: {
      title: 'NestJS Basics',
      content: 'Intro to NestJS',
      status: ArticleStatus.PUBLISHED,
      authorId: admin.id,
      categoryId: tech.id,
      tags: {
        connect: [{ id: tags[0].id }, { id: tags[3].id }],
      },
    },
  });

  const article2 = await prisma.article.create({
    data: {
      title: 'Docker Guide',
      content: 'How to containerize apps',
      status: ArticleStatus.DRAFT,
      authorId: editor.id,
      categoryId: tech.id,
      tags: {
        connect: [{ id: tags[1].id }, { id: tags[3].id }],
      },
    },
  });

  const article3 = await prisma.article.create({
    data: {
      title: 'Prisma ORM',
      content: 'Working with Prisma',
      status: ArticleStatus.PUBLISHED,
      authorId: admin.id,
      categoryId: science.id,
      tags: {
        connect: [{ id: tags[2].id }, { id: tags[4].id }],
      },
    },
  });

  await prisma.article.create({
    data: {
      title: 'Life article',
      content: 'Some life content',
      status: ArticleStatus.ARCHIVED,
      authorId: editor.id,
      categoryId: life.id,
      tags: {
        connect: [{ id: tags[4].id }],
      },
    },
  });

  await prisma.article.create({
    data: {
      title: 'API Design',
      content: 'Best practices',
      status: ArticleStatus.PUBLISHED,
      authorId: admin.id,
      categoryId: tech.id,
      tags: {
        connect: [{ id: tags[0].id }, { id: tags[3].id }, { id: tags[4].id }],
      },
    },
  });

  await prisma.comment.createMany({
    data: [
      {
        content: 'Great article!',
        articleId: article1.id,
        authorId: editor.id,
      },
      {
        content: 'Very useful',
        articleId: article2.id,
        authorId: admin.id,
      },
      {
        content: 'Thanks for sharing',
        articleId: article3.id,
        authorId: editor.id,
      },
    ],
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
