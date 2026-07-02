import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"

export async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error("Unauthorized. Please log in.")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { status: true },
  })

  if (user?.status === "INACTIVE") {
    throw new Error("Your staff account is inactive. Please contact the admin.")
  }

  return session
}

export async function requireAdmin() {
  const session = await requireSession()

  if (session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admins only")
  }

  return session
}

export async function requireAdminPage(redirectTo = "/") {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { status: true },
  })

  if (user?.status === "INACTIVE") {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect(redirectTo)
  }

  return session
}
