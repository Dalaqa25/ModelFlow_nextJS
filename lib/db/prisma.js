import { PrismaClient } from '@prisma/client'

// Global variable to store the Prisma client instance
let prisma

// Ensure we only create one Prisma client instance
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL,
      },
    },
  })
} else {
  // In development, use a global variable to prevent multiple instances
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL,
        },
      },
    })
  }
  prisma = global.prisma
}

// Graceful shutdown handlers
if (typeof window === 'undefined') {
  const gracefulShutdown = async (signal) => {
    console.log(`Received ${signal}. Closing database connections...`)
    try {
      await prisma.$disconnect()
      console.log('Database connections closed successfully')
      process.exit(0)
    } catch (error) {
      console.error('Error during graceful shutdown:', error)
      process.exit(1)
    }
  }

  process.on('beforeExit', gracefulShutdown)
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('uncaughtException', async (error) => {
    console.error('Uncaught Exception:', error)
    await gracefulShutdown('uncaughtException')
  })
  process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason)
    await gracefulShutdown('unhandledRejection')
  })
}

export { prisma }