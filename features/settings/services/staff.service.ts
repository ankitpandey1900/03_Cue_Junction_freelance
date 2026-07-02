import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { CreateStaffFormValues } from "../schemas/staff.schema"

export type StaffMember = {
  id: string
  name: string | null
  email: string
  role: string
  status: string
  lastLoginAt: Date | null
  lastLogoutAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export async function getStaffMembers(): Promise<StaffMember[]> {
  return await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      lastLoginAt: true,
      lastLogoutAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  })
}

export async function createStaff(data: CreateStaffFormValues): Promise<StaffMember> {
  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
    select: { id: true },
  })

  if (existing) {
    throw new Error("A staff login with this email already exists.")
  }

  const result = await auth.api.signUpEmail({
    body: {
      email: data.email.toLowerCase(),
      password: data.password,
      name: data.name,
    },
  })

  if (!result.user) {
    throw new Error("Staff login could not be created.")
  }

  return await prisma.user.update({
    where: { id: result.user.id },
    data: {
      role: data.role,
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      lastLoginAt: true,
      lastLogoutAt: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export async function updateStaffStatus(id: string, status: "ACTIVE" | "INACTIVE"): Promise<StaffMember> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  })

  if (!user) {
    throw new Error("Staff member not found.")
  }

  if (user.role === "ADMIN" && status === "INACTIVE") {
    const activeAdmins = await prisma.user.count({
      where: {
        role: "ADMIN",
        status: "ACTIVE",
        id: { not: id },
      },
    })

    if (activeAdmins === 0) {
      throw new Error("Keep at least one active admin account.")
    }
  }

  if (status === "INACTIVE") {
    await prisma.authSession.deleteMany({ where: { userId: id } })
  }

  return await prisma.user.update({
    where: { id },
    data: { status },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      lastLoginAt: true,
      lastLogoutAt: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}
