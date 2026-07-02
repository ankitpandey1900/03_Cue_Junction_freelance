"use client"

import { useState } from "react"
import { Resolver, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { MenuCategory, MenuItem } from "@prisma/client"
import { menuItemSchema, MenuItemFormValues } from "../schemas/item.schema"
import { createMenuItemAction, updateMenuItemAction, deleteMenuItemAction, toggleItemAvailabilityAction } from "../actions/item.actions"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Form,
  FormControl,
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
import { Trash2, Plus, Edit2, Search, X, Check, Flame } from "lucide-react"

interface MenuItemManagerProps {
  menuItems: (MenuItem & { category: { name: string } })[]
  categories: MenuCategory[]
}

export function MenuItemManager({ menuItems, categories }: MenuItemManagerProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("All")

  // Create form
  const createForm = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemSchema) as Resolver<MenuItemFormValues>,
    defaultValues: {
      categoryId: "",
      name: "",
      description: "",
      basePrice: 0,
      stock: 0,
      sku: "",
      imageUrl: "",
      preparationTime: 10,
      displayOrder: 0,
      isAvailable: true,
      isFeatured: false,
    },
  })

  // Edit form
  const editForm = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemSchema) as Resolver<MenuItemFormValues>,
  })

  const onCreateItem = async (data: MenuItemFormValues) => {
    setLoading("create")
    const res = await createMenuItemAction(data)
    if (res.success) {
      toast.success(res.message)
      createForm.reset()
    } else {
      toast.error(res.message)
    }
    setLoading(null)
  }

  const onUpdateItem = async (id: string, data: MenuItemFormValues) => {
    setLoading(id)
    const res = await updateMenuItemAction(id, data)
    if (res.success) {
      toast.success(res.message)
      setEditingId(null)
    } else {
      toast.error(res.message)
    }
    setLoading(null)
  }

  const onDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return
    setLoading(`delete-${id}`)
    const res = await deleteMenuItemAction(id)
    if (res.success) {
      toast.success(res.message)
    } else {
      toast.error(res.message)
    }
    setLoading(null)
  }

  const toggleItemAvailable = async (id: string, isAvailable: boolean) => {
    setLoading(`toggle-${id}`)
    const res = await toggleItemAvailabilityAction(id, isAvailable)
    if (!res.success) {
      toast.error(res.message)
    }
    setLoading(null)
  }

  const startEditing = (item: MenuItem) => {
    setEditingId(item.id)
    editForm.reset({
      categoryId: item.categoryId,
      sku: item.sku,
      name: item.name,
      description: item.description || "",
      basePrice: item.basePrice,
      imageUrl: item.imageUrl || "",
      preparationTime: item.preparationTime,
      displayOrder: item.displayOrder,
      isAvailable: item.isAvailable,
      isFeatured: item.isFeatured,
      stock: item.stock ?? 0,
    })
  }

  // Filter items
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === "All" || item.categoryId === filterCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Create form */}
      <div className="lg:col-span-1">
        <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-xl shadow-black/5">
          <CardHeader>
            <CardTitle className="text-base font-bold">Add Menu Item</CardTitle>
            <CardDescription>Create a new product with custom pricing and details.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateItem)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50 border-border/50">
                            <SelectValue placeholder="Select a Category">
                              {categories.find(c => c.id === field.value)?.name || null}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Cold Coffee" className="bg-background/50 border-border/50 text-xs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={createForm.control}
                    name="basePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Price (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            className="bg-background/50 border-border/50 text-xs font-mono"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inventory Stock (Qty)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            className="bg-background/50 border-border/50 text-xs font-mono"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Salted golden French Fries" className="bg-background/50 border-border/50 text-xs" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" size="sm" className="w-full gap-2" disabled={loading === "create"}>
                  <Plus className="h-4 w-4" />
                  {loading === "create" ? "Adding..." : "Add Product"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Product List */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-xl shadow-black/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span>Menu Items</span>
              <Badge variant="secondary" className="font-mono">{filteredItems.length} Products</Badge>
            </CardTitle>
            
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search item / SKU..."
                  className="pl-9 h-8 bg-background/40 border-border/50 text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={filterCategory} onValueChange={(val) => setFilterCategory(val ?? "All")}>
                <SelectTrigger className="w-full sm:w-[160px] h-8 bg-background/40 border-border/50 text-xs">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No products found.</p>
            ) : (
              <div className="divide-y divide-border/50 max-h-[500px] overflow-y-auto pr-1">
                {filteredItems.map((item) => (
                  <div key={item.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {editingId === item.id ? (
                      /* Editing Form */
                      <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit((data) => onUpdateItem(item.id, data))} className="w-full grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                          <div className="col-span-2 space-y-2">
                            <FormField
                              control={editForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Product Name</FormLabel>
                                  <FormControl>
                                    <Input className="h-8 text-xs bg-background/50 border-border/50" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={editForm.control}
                            name="basePrice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Price (₹)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    className="h-8 text-xs bg-background/50 border-border/50 font-mono"
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editForm.control}
                            name="stock"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Stock (Qty)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    className="h-8 text-xs bg-background/50 border-border/50 font-mono"
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex gap-2 justify-end">
                            <Button type="submit" size="icon" className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700" disabled={loading === item.id}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button type="button" size="icon" variant="outline" className="h-8 w-8 border-border/50" onClick={() => setEditingId(null)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </form>
                      </Form>
                    ) : (
                      /* Display Row */
                      <>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-foreground">{item.name}</span>
                            <Badge variant="outline" className="text-[9px] font-mono leading-none py-0.5 uppercase tracking-wide">
                              {item.category.name}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-[9px] font-mono leading-none py-0.5 px-2 rounded-md ${
                                item.isAvailable 
                                  ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/10 font-bold" 
                                  : "border-rose-500/30 text-rose-500 bg-rose-500/10 font-bold"
                              }`}
                            >
                              {item.isAvailable ? "Available" : "Disabled"}
                            </Badge>
                            {item.isFeatured && (
                              <Badge className="text-[9px] bg-primary/20 text-primary hover:bg-primary/30 leading-none py-0.5 flex items-center gap-0.5">
                                <Flame className="h-2.5 w-2.5 fill-primary/30" /> Pop
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{item.description || "No description provided."}</p>
                          <div className="flex items-center gap-3.5 text-[10px] text-muted-foreground font-mono">
                            <span>SKU: {item.sku}</span>
                            <span>•</span>
                            <span>Price: ₹{item.basePrice}</span>
                            <span>•</span>
                            <span className={`font-semibold ${item.stock <= 5 ? "text-rose-500 font-bold" : "text-emerald-500"}`}>
                              Stock: {item.stock} left
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-muted-foreground font-medium">Available:</span>
                            <Switch
                              checked={item.isAvailable}
                              onCheckedChange={(checked) => toggleItemAvailable(item.id, checked)}
                              disabled={loading === `toggle-${item.id}`}
                              className="data-[state=checked]:bg-emerald-500"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 border border-border/20 text-muted-foreground hover:text-foreground"
                            onClick={() => startEditing(item)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive border border-border/20"
                            onClick={() => onDeleteItem(item.id)}
                            disabled={loading === `delete-${item.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </>
                    )}
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
