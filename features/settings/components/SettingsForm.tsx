"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CafeSettings } from "@prisma/client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { formatInTimeZone } from "date-fns-tz"
import {
  Store,
  FileText,
  Users,
  ShieldAlert,
  Database,
  Clock,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Download,
  Upload,
  RefreshCw,
  Loader2,
  UserPlus,
  Power,
  KeyRound,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CafeSettingsFormValues, cafeSettingsSchema } from "../schemas/settings.schema"
import { CreateStaffFormValues } from "../schemas/staff.schema"
import { updateSettingsAction } from "../actions/settings.actions"
import { createStaffAction, updateStaffStatusAction } from "../actions/staff.actions"
import { StaffMember } from "../services/staff.service"

type PaymentKey = "acceptUpi" | "acceptCard" | "acceptCash"

const paymentMethods: { key: PaymentKey; label: string; description: string }[] = [
  { key: "acceptUpi", label: "UPI Payments", description: "PhonePe, GPay, Paytm, QR payments" },
  { key: "acceptCard", label: "Credit/Debit Cards", description: "Card machine or payment terminal" },
  { key: "acceptCash", label: "Cash Transactions", description: "Cash collected at counter" },
]

export function SettingsForm({
  initialData,
  staffMembers,
}: {
  initialData: CafeSettings
  staffMembers: StaffMember[]
}) {
  const [loading, setLoading] = useState(false)
  const [staffLoading, setStaffLoading] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("restaurant")
  const [createStaffOpen, setCreateStaffOpen] = useState(false)
  const [staffForm, setStaffForm] = useState<CreateStaffFormValues>({
    name: "",
    email: "",
    password: "",
    role: "STAFF",
  })

  const form = useForm<CafeSettingsFormValues>({
    resolver: zodResolver(cafeSettingsSchema),
    defaultValues: {
      cafeName: initialData.cafeName,
      defaultHourlyRate: initialData.defaultHourlyRate,
      receiptFooterText: initialData.receiptFooterText || "",
      logoUrl: initialData.logoUrl || "",
      address: initialData.address || "",
      phone: initialData.phone || "",
      email: initialData.email || "",
      currency: initialData.currency || "INR",
      taxRate: initialData.taxRate ?? 0,
      gstin: initialData.gstin || "",
      businessHours: initialData.businessHours || "",
      acceptUpi: initialData.acceptUpi,
      acceptCard: initialData.acceptCard,
      acceptCash: initialData.acceptCash,
    },
  })

  async function onSubmit(data: CafeSettingsFormValues) {
    setLoading(true)
    try {
      const res = await updateSettingsAction(data)
      if (res.success) {
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateStaff() {
    setStaffLoading("create")
    const res = await createStaffAction(staffForm)
    setStaffLoading(null)

    if (res.success) {
      toast.success(res.message)
      setStaffForm({ name: "", email: "", password: "", role: "STAFF" })
      setCreateStaffOpen(false)
    } else {
      toast.error(res.message)
    }
  }

  async function handleStaffStatus(staff: StaffMember) {
    const nextStatus = staff.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
    setStaffLoading(staff.id)
    const res = await updateStaffStatusAction(staff.id, nextStatus)
    setStaffLoading(null)

    if (res.success) {
      toast.success(res.message)
    } else {
      toast.error(res.message)
    }
  }

  const handleBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(initialData))
    const downloadAnchor = document.createElement("a")
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", `cue_junction_settings_${new Date().toISOString().split("T")[0]}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    toast.success("Settings configuration exported successfully")
  }

  const handleRestore = () => {
    toast.info("Restore flow is not enabled yet. Keep database restore as an owner-only manual operation.")
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      <div className="w-full md:w-56 shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 border-b md:border-b-0 md:border-r border-border md:pr-4">
        {[
          { id: "restaurant", label: "Restaurant Info", icon: Store },
          { id: "billing", label: "Payment Methods", icon: CreditCard },
          { id: "branding", label: "Branding & Receipt", icon: FileText },
          { id: "employees", label: "Employees & Roles", icon: Users },
          { id: "system", label: "System & Backup", icon: Database },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap text-left ${activeTab === tab.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="flex-1 w-full max-w-4xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {activeTab === "restaurant" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Restaurant Details</CardTitle>
                  <CardDescription className="text-xs">
                    Basic business information used on receipts and billing screens.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="cafeName" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Cafe Name</FormLabel>
                      <FormControl><Input placeholder="Cue Junction" className="h-9 text-sm" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs flex items-center gap-1"><Phone className="h-3 w-3" /> Phone Number</FormLabel>
                        <FormControl><Input placeholder="+91 98765 43210" className="h-9 text-sm" {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs flex items-center gap-1"><Mail className="h-3 w-3" /> Contact Email</FormLabel>
                        <FormControl><Input placeholder="contact@cuejunction.com" className="h-9 text-sm" {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs flex items-center gap-1"><MapPin className="h-3 w-3" /> Address</FormLabel>
                      <FormControl><Textarea placeholder="123 Pool Street, Game Town" className="text-sm resize-none" rows={3} {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="businessHours" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs flex items-center gap-1"><Clock className="h-3 w-3" /> Business Hours</FormLabel>
                      <FormControl><Input placeholder="10:00 AM - 11:00 PM" className="h-9 text-sm" {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>
            )}

            {activeTab === "billing" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Payment Methods</CardTitle>
                  <CardDescription className="text-xs">
                    Choose which payment options staff can use while recording invoice payments.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {paymentMethods.map((method) => (
                    <FormField key={method.key} control={form.control} name={method.key} render={({ field }) => (
                      <FormItem className="flex items-center justify-between gap-4 rounded-lg border border-border bg-accent/20 p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-xs font-semibold flex items-center gap-2">
                            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                            {method.label}
                          </FormLabel>
                          <FormDescription className="text-[10px]">{method.description}</FormDescription>
                        </div>
                        <FormControl>
                          <Switch 
                            checked={field.value} 
                            onCheckedChange={field.onChange} 
                            className="data-[state=checked]:bg-emerald-500"
                          />
                        </FormControl>
                      </FormItem>
                    )} />
                  ))}
                </CardContent>
              </Card>
            )}

            {activeTab === "branding" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Branding & Receipts</CardTitle>
                  <CardDescription className="text-xs">Customize receipt formats and branding details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="logoUrl" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Logo Image URL</FormLabel>
                      <FormControl><Input placeholder="https://example.com/logo.png" className="h-9 text-sm" {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="receiptFooterText" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Receipt Footer text</FormLabel>
                      <FormControl><Textarea placeholder="Thank you for visiting!" className="text-sm resize-none" rows={3} {...field} value={field.value || ""} /></FormControl>
                      <FormDescription className="text-[10px]">Add social handles, promo notes or custom terms.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>
            )}

            {activeTab === "employees" && (
              <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">Employee Roles & Permissions</CardTitle>
                    <CardDescription className="text-xs">
                      Create staff login IDs, control access, and keep admin actions auditable.
                    </CardDescription>
                  </div>
                  <Dialog open={createStaffOpen} onOpenChange={setCreateStaffOpen}>
                    <DialogTrigger render={
                      <Button type="button" size="sm" className="h-8 text-xs gap-1.5">
                        <UserPlus className="h-3.5 w-3.5" />
                        Add Staff
                      </Button>
                    } />
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create staff login</DialogTitle>
                        <DialogDescription className="text-xs">
                          This creates an email and password login. Share the password privately with the staff member.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Name</Label>
                          <Input className="h-9 text-sm" value={staffForm.name} onChange={(event) => setStaffForm((current) => ({ ...current, name: event.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Email Login ID</Label>
                          <Input className="h-9 text-sm" type="email" value={staffForm.email} onChange={(event) => setStaffForm((current) => ({ ...current, email: event.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Password</Label>
                          <Input className="h-9 text-sm" type="password" value={staffForm.password} onChange={(event) => setStaffForm((current) => ({ ...current, password: event.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Role</Label>
                          <Select value={staffForm.role} onValueChange={(value: "ADMIN" | "STAFF" | null) => {
                            if (value) {
                              setStaffForm((current) => ({ ...current, role: value }));
                            }
                          }}>
                            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="STAFF">Staff</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="button" className="w-full h-9 text-xs gap-1.5" onClick={handleCreateStaff} disabled={staffLoading === "create"}>
                          {staffLoading === "create" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                          Create login
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/40 text-xs">
                    {staffMembers.map((staff) => (
                      <div key={staff.id} className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{staff.name || "Unnamed staff"}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{staff.email}</p>
                          <div className="flex flex-col gap-0.5 text-[9px] text-muted-foreground mt-1.5 font-mono">
                            {staff.lastLoginAt ? (
                              <span suppressHydrationWarning>In: {formatInTimeZone(new Date(staff.lastLoginAt), "Asia/Kolkata", "MMM d, hh:mm a")}</span>
                            ) : (
                              <span>In: Never logged in</span>
                            )}
                            {staff.lastLogoutAt && (
                              <span suppressHydrationWarning>Out: {formatInTimeZone(new Date(staff.lastLogoutAt), "Asia/Kolkata", "MMM d, hh:mm a")}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Badge variant="secondary" className="text-[9px] font-semibold">{staff.role}</Badge>
                          <Badge className={`text-[9px] font-semibold ${staff.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"}`}>
                            {staff.status}
                          </Badge>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10px] gap-1"
                            onClick={() => handleStaffStatus(staff)}
                            disabled={staffLoading === staff.id}
                          >
                            {staffLoading === staff.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Power className="h-3 w-3" />}
                            {staff.status === "ACTIVE" ? "Remove access" : "Restore access"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "system" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">System Utilities & Backups</CardTitle>
                  <CardDescription className="text-xs">Backup and restore controls for owner use.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between gap-4 text-xs p-3 border border-border rounded-lg bg-accent/20">
                    <div>
                      <p className="font-semibold text-foreground flex items-center gap-1.5"><Database className="h-3.5 w-3.5 text-muted-foreground" /> Export Settings configuration</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Download a local JSON backup file of configuration parameters.</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={handleBackup} className="h-8 gap-1.5 text-xs"><Download className="h-3.5 w-3.5" /> Export</Button>
                  </div>

                  <div className="flex items-center justify-between gap-4 text-xs p-3 border border-border rounded-lg bg-accent/20">
                    <div>
                      <p className="font-semibold text-foreground flex items-center gap-1.5"><Upload className="h-3.5 w-3.5 text-muted-foreground" /> Restore Backup settings</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Restore should be done carefully by the owner or developer.</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={handleRestore} className="h-8 gap-1.5 text-xs"><Upload className="h-3.5 w-3.5" /> Restore</Button>
                  </div>

                  <div className="flex items-center justify-between gap-4 text-xs p-3 border border-destructive/20 rounded-lg bg-destructive/5">
                    <div>
                      <p className="font-semibold text-destructive flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5" /> Full Factory Reset</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Resetting live business data is intentionally disabled from the UI.</p>
                    </div>
                    <Button type="button" variant="destructive" size="sm" disabled className="h-8 text-xs">Disabled</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {(activeTab === "restaurant" || activeTab === "billing" || activeTab === "branding") && (
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={loading} size="sm" className="h-8 text-xs gap-1.5">
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3" />
                      Save configurations
                    </>
                  )}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  )
}
