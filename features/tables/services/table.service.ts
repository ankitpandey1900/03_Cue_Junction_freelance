import { Table, TableType, Session } from "@prisma/client"
import { TableFormValues, TableTypeFormValues } from "../schemas/table.schema"
import prisma from "@/lib/prisma"

export type TableWithDetails = Table & {
  tableType: TableType
  sessions?: Session[]
}

export async function getTables(): Promise<TableWithDetails[]> {
  return await prisma.table.findMany({
    where: { isArchived: false },
    include: {
      tableType: true,
      sessions: {
        where: {
          status: { in: ["ACTIVE", "PAUSED"] }
        }
      }
    },
    orderBy: {
      name: 'asc',
    },
  })
}

export async function getTableTypes(): Promise<TableType[]> {
  return await prisma.tableType.findMany({
    where: { isArchived: false },
    orderBy: {
      name: 'asc',
    },
  })
}

export async function getTableById(id: string): Promise<TableWithDetails | null> {
  return await prisma.table.findUnique({
    where: { id, isArchived: false },
    include: {
      tableType: true,
    },
  })
}

export async function createTable(data: TableFormValues): Promise<Table> {
  return await prisma.table.create({
    data: {
      name: data.name,
      status: data.status,
      tableTypeId: data.tableTypeId,
    },
  })
}

export async function updateTable(id: string, data: TableFormValues): Promise<Table> {
  return await prisma.table.update({
    where: { id },
    data: {
      name: data.name,
      status: data.status,
      tableTypeId: data.tableTypeId,
    },
  })
}

export async function updateTableStatus(id: string, status: string): Promise<Table> {
  return await prisma.table.update({
    where: { id },
    data: { status },
  })
}

export async function createTableType(data: TableTypeFormValues): Promise<TableType> {
  return await prisma.tableType.create({
    data: {
      name: data.name,
      hourlyRate: data.hourlyRate,
      minimumCharge: data.minimumCharge ?? 0,
      fixedRate: data.fixedRate ?? null,
      fixedDuration: data.fixedDuration ?? null,
      overtimeHourlyRate: data.overtimeHourlyRate ?? null,
    },
  })
}

export async function updateTableType(id: string, data: TableTypeFormValues): Promise<TableType> {
  return await prisma.tableType.update({
    where: { id },
    data: {
      name: data.name,
      hourlyRate: data.hourlyRate,
      minimumCharge: data.minimumCharge ?? 0,
      fixedRate: data.fixedRate ?? null,
      fixedDuration: data.fixedDuration ?? null,
      overtimeHourlyRate: data.overtimeHourlyRate ?? null,
    },
  })
}

export async function deleteTable(id: string): Promise<Table> {
  return await prisma.table.update({
    where: { id },
    data: { isArchived: true, status: "MAINTENANCE" }
  })
}

export async function deleteTableType(id: string): Promise<TableType> {
  return await prisma.tableType.update({
    where: { id },
    data: { isArchived: true }
  })
}
