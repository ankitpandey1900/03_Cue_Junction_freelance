import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import prisma from "./prisma"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    modelName: "user",
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "STAFF",
        input: false,
      },
    },
  },
  session: {
    modelName: "authSession",
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  account: {
    modelName: "account"
  },
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          await prisma.user.update({
            where: { id: session.userId },
            data: { lastLoginAt: new Date() }
          })
        }
      },
      delete: {
        after: async (session) => {
          if (session?.userId) {
            await prisma.user.update({
              where: { id: session.userId },
              // update logout time
              data: { lastLogoutAt: new Date() }
            })
          }
        }
      }
    }
  }
})
