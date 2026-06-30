"use client"

import { useState } from "react"
import { CafeSettings } from "@prisma/client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CafeSettingsFormValues, cafeSettingsSchema } from "../schemas/settings.schema"
import { updateSettingsAction } from "../actions/settings.actions"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { 
  Store, 
  IndianRupee, 
  FileText, 
  Users, 
  ShieldAlert, 
  Database, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Percent, 
  CreditCard,
  Download,
  Upload,
  RefreshCw,
  Loader2
} from "lucide-react"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"

export function SettingsForm({ initialData }: { initialData: CafeSettings }) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("restaurant")

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
      taxRate: initialData.taxRate ?? 5.0,
      gstin: initialData.gstin || "",
      businessHours: initialData.businessHours || "",
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

  // Simulated employee profiles for Employee section
  const [employees, setEmployees] = useState([
    { id: "1", name: "Cafe Owner", email: "admin@cuejunction.com", role: "ADMIN", status: "ACTIVE" },
    { id: "2", name: "John Staff", email: "staff@cuejunction.com", role: "STAFF", status: "ACTIVE" },
    { id: "3", name: "Sarah Cashier", email: "sarah@cuejunction.com", role: "STAFF", status: "INACTIVE" },
  ])

  const toggleEmployeeStatus = (id: string) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === id ? { ...emp, status: emp.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" } : emp
    ))
    toast.success("Employee status updated")
  }

  // Simulated backup download trigger
  const handleBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(initialData))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", `cue_junction_settings_${new Date().toISOString().split('T')[0]}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    toast.success("Settings configuration exported successfully")
  }

  const handleRestore = () => {
    toast.info("Database restore service simulated. Please upload configurations.")
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      {/* Settings Navigation Sidebar */}
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
              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap text-left ${
                activeTab === tab.id
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

      {/* Settings Panel Body */}
      <div className="flex-1 w-full max-w-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {activeTab === "restaurant" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Restaurant Details</CardTitle>
                  <CardDescription className="text-xs">
                    Specify basic business information used across system checkouts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="cafeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Cafe Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Cue Junction" className="h-9 text-sm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs flex items-center gap-1">
                            <Phone className="h-3 w-3" /> Phone Number
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="+91 98765 43210" className="h-9 text-sm" {...field} value={field.value || ""} />
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
                          <FormLabel className="text-xs flex items-center gap-1">
                            <Mail className="h-3 w-3" /> Contact Email
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="contact@cuejunction.com" className="h-9 text-sm" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Address
                        </FormLabel>
                        <FormControl>
                          <Textarea placeholder="123 Pool Street, Game Town" className="text-sm resize-none" rows={3} {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Business Hours
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="10:00 AM - 11:00 PM" className="h-9 text-sm" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {activeTab === "billing" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Payment Methods</CardTitle>
                  <CardDescription className="text-xs">
                    Configure checkout payment methods accepted at billing.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold block">Accepted Payment Methods</Label>
                    <div className="space-y-2">
                      {["UPI Payments", "Credit/Debit Cards", "Cash Transactions"].map((method) => (
                        <div key={method} className="flex items-center justify-between text-xs py-1">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                            {method}
                          </span>
                          <Switch checked={true} disabled />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "branding" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Branding & Receipts</CardTitle>
                  <CardDescription className="text-xs">
                    Customize receipt formats and branding details.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Logo Image URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/logo.png" className="h-9 text-sm" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="receiptFooterText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Receipt Footer text</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Thank you for visiting!" className="text-sm resize-none" rows={3} {...field} value={field.value || ""} />
                        </FormControl>
                        <FormDescription className="text-[10px]">
                          Add social handles, promo notes or custom terms.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {activeTab === "employees" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Employee Roles & Permissions</CardTitle>
                  <CardDescription className="text-xs">
                    View list of staff members and change their roles or status values.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/40 text-xs">
                    {employees.map((emp) => (
                      <div key={emp.id} className="flex justify-between items-center p-3.5">
                        <div>
                          <p className="font-semibold text-foreground">{emp.name}</p>
                          <p className="text-[10px] text-muted-foreground">{emp.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="text-[9px] font-semibold">
                            {emp.role}
                          </Badge>
                          <button
                            type="button"
                            onClick={() => toggleEmployeeStatus(emp.id)}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-colors ${
                              emp.status === "ACTIVE" 
                                ? "bg-emerald-500/10 text-emerald-500" 
                                : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            {emp.status}
                          </button>
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
                  <CardDescription className="text-xs">
                    Configure backups, restores and audit controls for data security.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs p-3 border border-border rounded-lg bg-accent/20">
                      <div>
                        <p className="font-semibold text-foreground flex items-center gap-1.5">
                          <Database className="h-3.5 w-3.5 text-muted-foreground" />
                          Export Settings configuration
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Download a local JSON backup file of configuration parameters.
                        </p>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={handleBackup} className="h-8 gap-1.5 text-xs">
                        <Download className="h-3.5 w-3.5" />
                        Export
                      </Button>
                    </div>

                    <div className="flex items-center justify-between text-xs p-3 border border-border rounded-lg bg-accent/20">
                      <div>
                        <p className="font-semibold text-foreground flex items-center gap-1.5">
                          <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                          Restore Backup settings
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Upload configurations json to restore settings configurations.
                        </p>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={handleRestore} className="h-8 gap-1.5 text-xs">
                        <Upload className="h-3.5 w-3.5" />
                        Restore
                      </Button>
                    </div>

                    <div className="flex items-center justify-between text-xs p-3 border border-destructive/20 rounded-lg bg-destructive/5">
                      <div>
                        <p className="font-semibold text-destructive flex items-center gap-1.5">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          Full Factory Reset
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Reset the settings parameters to system defaults. Cannot be undone.
                        </p>
                      </div>
                      <Button type="button" variant="destructive" size="sm" disabled className="h-8 text-xs">
                        Reset Defaults
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Save Buttons (for DB backed tabs) */}
            {(activeTab === "restaurant" || activeTab === "billing" || activeTab === "branding") && (
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={loading} size="sm" className="h-8 text-xs gap-1.5">
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving…
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
