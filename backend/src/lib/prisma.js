const { PrismaClient } = require('@prisma/client');

// Single shared PrismaClient for the whole process. Instantiating one client
// per module opens a separate connection pool each time, which exhausts the
// PostgreSQL connection limit under load. Cache the instance on globalThis so
// nodemon/hot-reload in development does not leak a new pool on every restart.
const globalForPrisma = globalThis;

const prisma = globalForPrisma.__sugamPrisma || new PrismaClient();

if (!globalForPrisma.__sugamPrisma) {
  globalForPrisma.__sugamPrisma = prisma;
}

module.exports = prisma;
