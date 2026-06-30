"use client"

import { useState } from "react"
import { Resolver, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { MenuCategory } from "@prisma/client"
import { categorySchema, CategoryFormValues } from "../schemas/category.schema"
import { createCategoryAction, updateCategoryAction, deleteCategoryAction } from "../actions/category.actions"
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
import { Trash2, Plus, Edit2, Check, X } from "lucide-react"

interface CategoryManagerProps {
  categories: MenuCategory[]
}

export function CategoryManager({ categories }: CategoryManagerProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form for creating a category
  const createForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema) as Resolver<CategoryFormValues>,
    defaultValues: { name: "", description: "", displayOrder: 0, isActive: true },
  })

  // Form for editing a category
  const editForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema) as Resolver<CategoryFormValues>,
  })

  const onCreateCategory = async (data: CategoryFormValues) => {
    setLoading("create")
    const res = await createCategoryAction(data)
    if (res.success) {
      toast.success(res.message)
      createForm.reset()
    } else {
      toast.error(res.message)
    }
    setLoading(null)
  }

  const onUpdateCategory = async (id: string, data: CategoryFormValues) => {
    setLoading(id)
    const res = await updateCategoryAction(id, data)
    if (res.success) {
      toast.success(res.message)
      setEditingId(null)
    } else {
      toast.error(res.message)
    }
    setLoading(null)
  }

  const onDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return
    setLoading(`delete-${id}`)
    const res = await deleteCategoryAction(id)
    if (res.success) {
      toast.success(res.message)
    } else {
      toast.error(res.message)
    }
    setLoading(null)
  }

  const toggleCategoryActive = async (category: MenuCategory, isActive: boolean) => {
    setLoading(`toggle-${category.id}`)
    const res = await updateCategoryAction(category.id, {
      name: category.name,
      description: category.description,
      displayOrder: category.displayOrder,
      isActive,
    })
    if (!res.success) {
      toast.error(res.message)
    }
    setLoading(null)
  }

  const startEditing = (category: MenuCategory) => {
    setEditingId(category.id)
    editForm.reset({
      name: category.name,
      description: category.description || "",
      displayOrder: category.displayOrder,
      isActive: category.isActive,
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Category Creation Form */}
      <div className="lg:col-span-1">
        <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-xl shadow-black/5">
          <CardHeader>
            <CardTitle className="text-base font-bold">Add New Category</CardTitle>
            <CardDescription>Create categories like &ldquo;Main Course&rdquo;, &ldquo;Drinks&rdquo;, etc.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateCategory)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Snacks" className="bg-background/50 border-border/50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Delicious quick snacks" className="bg-background/50 border-border/50" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Simplified layout */}
                <FormField
                  control={createForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-3 bg-background/30">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Active</FormLabel>
                        <div className="text-[10px] text-muted-foreground">Enable to show in the POS menu.</div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" size="sm" className="w-full gap-2" disabled={loading === "create"}>
                  <Plus className="h-4 w-4" />
                  {loading === "create" ? "Adding..." : "Add Category"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Existing Categories Table */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-xl shadow-black/5">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span>Existing Categories</span>
              <Badge variant="secondary" className="font-mono">{categories.length} Categories</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No categories found.</p>
            ) : (
              <div className="divide-y divide-border/50">
                {categories.map((cat) => (
                  <div key={cat.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {editingId === cat.id ? (
                      /* Editing Mode */
                      <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit((data) => onUpdateCategory(cat.id, data))} className="w-full grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                          <div className="md:col-span-2 space-y-2">
                            <FormField
                              control={editForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Category Name</FormLabel>
                                  <FormControl>
                                    <Input size={30} className="h-8 text-xs bg-background/50 border-border/50" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={editForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Description</FormLabel>
                                  <FormControl>
                                    <Input className="h-8 text-xs bg-background/50 border-border/50" {...field} value={field.value ?? ""} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          {/* Sort Order hidden */}
                          <div className="flex gap-2 justify-end">
                            <Button type="submit" size="icon" className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700" disabled={loading === cat.id}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button type="button" size="icon" variant="outline" className="h-8 w-8 border-border/50" onClick={() => setEditingId(null)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </form>
                      </Form>
                    ) : (
                      /* Display Mode */
                      <>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">{cat.name}</span>
                            <Badge variant={cat.isActive ? "outline" : "secondary"} className="text-[10px] font-mono leading-none py-0.5">
                              {cat.isActive ? "Active" : "Disabled"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{cat.description || "No description provided."}</p>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
                            <span>Slug: {cat.slug}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-muted-foreground font-medium">Visible:</span>
                            <Switch
                              checked={cat.isActive}
                              onCheckedChange={(checked) => toggleCategoryActive(cat, checked)}
                              disabled={loading === `toggle-${cat.id}`}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 border border-border/20 text-muted-foreground hover:text-foreground"
                            onClick={() => startEditing(cat)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive border border-border/20"
                            onClick={() => onDeleteCategory(cat.id)}
                            disabled={loading === `delete-${cat.id}`}
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
