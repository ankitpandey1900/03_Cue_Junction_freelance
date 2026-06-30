"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { TableType } from "@prisma/client"
import { tableTypeSchema, tableSchema, TableTypeFormValues, TableFormValues } from "../schemas/table.schema"
import {
  createTableTypeAction,
  updateTableTypeAction,
  createTableAction,
  updateTableAction,
  deleteTableAction,
  deleteTableTypeAction
} from "../actions/table.actions"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2, Plus, Pencil, X } from "lucide-react"
import { TableWithDetails } from "../services/table.service"

interface ManageAssetsClientProps {
  tables: TableWithDetails[]
  tableTypes: TableType[]
}

export function ManageAssetsClient({ tables, tableTypes }: ManageAssetsClientProps) {
  const [loadingTypeDelete, setLoadingTypeDelete] = useState<string | null>(null)
  const [loadingTableDelete, setLoadingTableDelete] = useState<string | null>(null)

  // Edit Modes state
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null)
  const [editingTableId, setEditingTableId] = useState<string | null>(null)

  // Table Type form
  const typeForm = useForm<TableTypeFormValues>({
    resolver: zodResolver(tableTypeSchema),
    defaultValues: { name: "", hourlyRate: 0, minimumCharge: 0, fixedRate: null, fixedDuration: null },
  })

  // Table form
  const tableForm = useForm<TableFormValues>({
    resolver: zodResolver(tableSchema),
    defaultValues: { name: "", tableTypeId: "", status: "AVAILABLE" },
  })

  const onSubmitType = async (data: TableTypeFormValues) => {
    let res
    if (editingTypeId) {
      res = await updateTableTypeAction(editingTypeId, data)
    } else {
      res = await createTableTypeAction(data)
    }

    if (res.success) {
      toast.success(res.message)
      typeForm.reset()
      setEditingTypeId(null)
    } else {
      toast.error(res.message)
    }
  }

  const onSubmitTable = async (data: TableFormValues) => {
    let res
    if (editingTableId) {
      res = await updateTableAction(editingTableId, data)
    } else {
      res = await createTableAction(data)
    }

    if (res.success) {
      toast.success(res.message)
      tableForm.reset()
      setEditingTableId(null)
    } else {
      toast.error(res.message)
    }
  }

  const handleEditTypeClick = (tt: TableType) => {
    setEditingTypeId(tt.id)
    typeForm.setValue("name", tt.name)
    typeForm.setValue("hourlyRate", tt.hourlyRate)
    typeForm.setValue("minimumCharge", tt.minimumCharge)
  }

  const handleEditTableClick = (t: TableWithDetails) => {
    setEditingTableId(t.id)
    tableForm.setValue("name", t.name)
    tableForm.setValue("tableTypeId", t.tableTypeId)
    tableForm.setValue("status", t.status as any)
  }

  const handleCancelTypeEdit = () => {
    setEditingTypeId(null)
    typeForm.reset({ name: "", hourlyRate: 0, minimumCharge: 0, fixedRate: null, fixedDuration: null })
  }

  const handleCancelTableEdit = () => {
    setEditingTableId(null)
    tableForm.reset({ name: "", tableTypeId: "", status: "AVAILABLE" })
  }

  const handleDeleteType = async (id: string) => {
    if (editingTypeId === id) {
      handleCancelTypeEdit()
    }
    setLoadingTypeDelete(id)
    const res = await deleteTableTypeAction(id)
    if (res.success) {
      toast.success(res.message)
    } else {
      toast.error(res.message)
    }
    setLoadingTypeDelete(null)
  }

  const handleDeleteTable = async (id: string) => {
    if (editingTableId === id) {
      handleCancelTableEdit()
    }
    setLoadingTableDelete(id)
    const res = await deleteTableAction(id)
    if (res.success) {
      toast.success(res.message)
    } else {
      toast.error(res.message)
    }
    setLoadingTableDelete(null)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Table Types Section */}
      <div className="space-y-4">
        <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-xl shadow-black/5 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>{editingTypeId ? `Edit Table Type: ${typeForm.getValues("name")}` : "Add Table Type"}</span>
              {editingTypeId && (
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={handleCancelTypeEdit}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              Define pricing categories like Pool Tables, Gaming Consoles, etc.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...typeForm}>
              <form onSubmit={typeForm.handleSubmit(onSubmitType)} className="space-y-4">
                <FormField
                  control={typeForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Standard Pool Table" className="h-9 text-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={typeForm.control}
                    name="hourlyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Hourly Rate (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="150"
                            className="h-9 text-sm"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={typeForm.control}
                    name="minimumCharge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Min. Charge (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            className="h-9 text-sm"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription className="text-[10px] leading-tight">
                          Minimum checkout bill amount.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" size="sm" className="gap-2">
                    {editingTypeId ? "Save Changes" : "Create Table Type"}
                  </Button>
                  {editingTypeId && (
                    <Button type="button" variant="outline" size="sm" onClick={handleCancelTypeEdit}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Existing Table Types List */}
        <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-xl shadow-black/5 transition-all duration-300">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-semibold">
              Existing Types
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({tableTypes.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {tableTypes.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No table types configured yet.
              </p>
            ) : (
              <div className="divide-y divide-border/50 text-xs">
                {tableTypes.map((tt) => (
                  <div
                    key={tt.id}
                    className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors group"
                  >
                    <div>
                      <p className="font-semibold text-foreground">
                        {tt.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        ₹{tt.hourlyRate}/hr · Min ₹{tt.minimumCharge}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground opacity-50 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleEditTypeClick(tt)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-50 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteType(tt.id)}
                        disabled={loadingTypeDelete === tt.id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables Section */}
      <div className="space-y-4">
        <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-xl shadow-black/5 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>{editingTableId ? `Edit Table / Console: ${tableForm.getValues("name")}` : "Add Table / Console"}</span>
              {editingTableId && (
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={handleCancelTableEdit}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              Configure a physical pool table or console session asset.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...tableForm}>
              <form onSubmit={tableForm.handleSubmit(onSubmitTable)} className="space-y-4">
                <FormField
                  control={tableForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Table 1" className="h-9 text-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={tableForm.control}
                  name="tableTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select type">
                              {(value) => {
                                const selected = tableTypes.find((tt) => tt.id === value)
                                return selected ? `${selected.name} (₹${selected.hourlyRate}/hr)` : "Select type"
                              }}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tableTypes.map((tt) => (
                            <SelectItem key={tt.id} value={tt.id}>
                              {tt.name} (₹{tt.hourlyRate}/hr)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex gap-2">
                  <Button type="submit" size="sm" className="gap-2">
                    {editingTableId ? "Save Changes" : "Add Table"}
                  </Button>
                  {editingTableId && (
                    <Button type="button" variant="outline" size="sm" onClick={handleCancelTableEdit}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Existing Tables List */}
        <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-xl shadow-black/5 transition-all duration-300">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-semibold">
              Existing Tables
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({tables.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {tables.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No physical tables configured. Create a type first.
              </p>
            ) : (
              <div className="divide-y divide-border/50 text-xs">
                {tables.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors group"
                  >
                    <div>
                      <p className="font-semibold text-foreground">
                        {t.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {t.tableType.name} · ₹{t.tableType.hourlyRate}/hr
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`text-[10px] px-1.5 py-0.5 font-medium border uppercase ${
                          t.status === "AVAILABLE"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        }`}
                      >
                        {t.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground opacity-50 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleEditTableClick(t)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-50 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteTable(t.id)}
                        disabled={loadingTableDelete === t.id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
