"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateBookingDialog } from "@/features/bookings/components/CreateBookingDialog"
import { Customer, Table } from "@prisma/client"

type CustomerList = Pick<Customer, "id" | "name" | "phone">
type TableList = Table & { tableType: { name: string } }

interface BookingsPageClientProps {
  customers: CustomerList[]
  tables: TableList[]
}

export function BookingsPageClient({ customers, tables }: BookingsPageClientProps) {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setCreateOpen(true)} size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Create Booking
      </Button>

      <CreateBookingDialog 
        open={createOpen} 
        onOpenChange={setCreateOpen} 
        customers={customers}
        tables={tables}
      />
    </>
  )
}
