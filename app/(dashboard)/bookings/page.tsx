import { getBookings } from "@/features/bookings/services/booking.service"
import { getCustomers } from "@/features/customers/services/customer.service"
import { getTables, getTableTypes } from "@/features/tables/services/table.service"
import { BookingsList } from "@/features/bookings/components/BookingsList"

export const dynamic = "force-dynamic"

export default async function BookingsPage() {
  const [bookings, customers, tables, tableTypes] = await Promise.all([
    getBookings(),
    getCustomers(),
    getTables(),
    getTableTypes()
  ])

  // Process data for the views
  const mappedBookings = (bookings as any[]).map(b => ({
    id: b.id,
    startTime: b.startTime,
    endTime: b.endTime,
    status: b.status,
    customer: {
      id: b.customer.id,
      name: b.customer.name,
      phone: b.customer.phone || ""
    },
    table: b.table ? {
      id: b.table.id,
      name: b.table.name,
      tableType: {
        name: b.table.tableType.name
      }
    } : null,
    tableType: b.tableType ? {
      id: b.tableType.id,
      name: b.tableType.name
    } : null
  }))

  const customerList = customers.map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone
  }))

  const tableList = tables.map(t => ({
    ...t,
    tableType: {
      id: t.tableType.id,
      name: t.tableType.name
    }
  }))

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          Table Bookings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage advance reservations
        </p>
      </div>

      <BookingsList 
        bookings={mappedBookings} 
        tables={tableList} 
        customers={customerList}
        tableTypes={tableTypes}
      />
    </div>
  )
}
