/*
  Warnings:

  - The values [DRAFT,PUBLISHED,ARCHIVED] on the enum `ArticleStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [ADMIN,EDITOR,VIEWER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ArticleStatus_new" AS ENUM ('draft', 'published', 'archived');
ALTER TABLE "Article" ALTER COLUMN "status" TYPE "ArticleStatus_new" USING ("status"::text::"ArticleStatus_new");
ALTER TYPE "ArticleStatus" RENAME TO "ArticleStatus_old";
ALTER TYPE "ArticleStatus_new" RENAME TO "ArticleStatus";
DROP TYPE "public"."ArticleStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('admin', 'editor', 'viewer');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
COMMIT;
