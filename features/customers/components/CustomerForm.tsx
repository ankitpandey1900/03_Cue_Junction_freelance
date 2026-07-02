"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Customer } from "@prisma/client"
import { useRouter } from "next/navigation"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { customerSchema, CustomerFormValues } from "../schemas/customer.schema"
import { createCustomerAction, updateCustomerAction, deleteCustomerAction } from "../actions/customer.actions"
import { toast } from "sonner"
import { Trash } from "lucide-react"

interface CustomerFormProps {
  initialData?: Customer
  onSuccess?: () => void
}

export function CustomerForm({ initialData, onSuccess }: CustomerFormProps) {
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const router = useRouter()

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: initialData?.name || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
    },
  })

  const onSubmit = async (data: CustomerFormValues) => {
    setLoading(true)
    try {
      const response = initialData
        ? await updateCustomerAction(initialData.id, data)
        : await createCustomerAction(data)

      if (response.success) {
        toast.success(response.message)
        if (onSuccess) onSuccess()
        if (!initialData) {
          form.reset()
          router.push("/customers")
        }
      } else {
        toast.error(response.message)
      }
    } catch {
      toast.error("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!initialData) return
    if (!confirm("Are you sure you want to delete this customer? This will hide them from the frontend but keep their invoice history intact in the database.")) return
    
    setDeleteLoading(true)
    try {
      const response = await deleteCustomerAction(initialData.id)
      if (response.success) {
        toast.success(response.message)
        router.push("/customers")
      } else {
        toast.error(response.message)
      }
    } catch {
      toast.error("Something went wrong.")
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Elon Musk" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="9876543210" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address (Optional)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="elon@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <Button type="submit" className="w-full text-xs h-9 font-semibold" disabled={loading || deleteLoading}>
            {loading ? "Saving..." : initialData ? "Update Customer" : "Create Customer"}
          </Button>

          {initialData && (
            <Button
              type="button"
              variant="destructive"
              className="w-full text-xs h-9 font-semibold gap-1.5"
              disabled={loading || deleteLoading}
              onClick={handleDelete}
            >
              <Trash className="h-4 w-4" />
              {deleteLoading ? "Deleting..." : "Delete Customer"}
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
