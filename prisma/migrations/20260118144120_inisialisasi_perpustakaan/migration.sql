-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "BorrowStatus" AS ENUM ('PENDING', 'APPROVED', 'RETURNED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "books" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "isbn" TEXT,
    "description" TEXT,
    "coverImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_books" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "location" TEXT,
    "condition" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "borrows" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "userBookId" TEXT NOT NULL,
    "lenderId" TEXT NOT NULL,
    "status" "BorrowStatus" NOT NULL DEFAULT 'PENDING',
    "borrowDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "returnDate" TIMESTAMP(3),
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "borrows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "books_isbn_key" ON "books"("isbn");

-- CreateIndex
CREATE INDEX "user_books_userId_idx" ON "user_books"("userId");

-- CreateIndex
CREATE INDEX "user_books_bookId_idx" ON "user_books"("bookId");

-- CreateIndex
CREATE INDEX "user_books_isAvailable_idx" ON "user_books"("isAvailable");

-- CreateIndex
CREATE INDEX "user_books_location_idx" ON "user_books"("location");

-- CreateIndex
CREATE UNIQUE INDEX "user_books_userId_bookId_key" ON "user_books"("userId", "bookId");

-- CreateIndex
CREATE INDEX "borrows_userId_idx" ON "borrows"("userId");

-- CreateIndex
CREATE INDEX "borrows_bookId_idx" ON "borrows"("bookId");

-- CreateIndex
CREATE INDEX "borrows_lenderId_idx" ON "borrows"("lenderId");

-- CreateIndex
CREATE INDEX "borrows_status_idx" ON "borrows"("status");

-- AddForeignKey
ALTER TABLE "user_books" ADD CONSTRAINT "user_books_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_books" ADD CONSTRAINT "user_books_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrows" ADD CONSTRAINT "borrows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrows" ADD CONSTRAINT "borrows_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrows" ADD CONSTRAINT "borrows_lenderId_fkey" FOREIGN KEY ("lenderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrows" ADD CONSTRAINT "borrows_userBookId_fkey" FOREIGN KEY ("userBookId") REFERENCES "user_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
