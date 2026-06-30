import { headers } from "next/headers"
import { auth } from "@/lib/auth"

export async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error("Unauthorized. Please log in.")
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
