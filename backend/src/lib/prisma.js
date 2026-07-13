// ============================================
// Prisma Singleton — EventCrew
// Satu instance PrismaClient dipakai bersama
// seluruh controller untuk menghindari
// connection pool overflow di Supabase Free.
// ============================================

const { PrismaClient } = require('@prisma/client');

// Gunakan global untuk menghindari multiple instance saat hot-reload (nodemon)
const globalForPrisma = global;

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
