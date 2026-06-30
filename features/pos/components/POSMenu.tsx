"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Link from "next/link"
import { placeOrderAction } from "../actions/pos.actions"
import { Plus, Minus, ShoppingCart, Search, Trash2, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface MenuItem {
  id: string
  categoryId: string
  sku: string
  name: string
  slug: string
  description: string | null
  basePrice: number
  imageUrl: string | null
  preparationTime: number
  isAvailable: boolean
  isFeatured: boolean
  stock: number
  category: {
    name: string
  }
}

interface ActiveSession {
  id: string
  table: {
    name: string
  }
  customer: {
    name: string
  } | null
}

interface POSMenuProps {
  menuItems: MenuItem[]
  activeSessions: ActiveSession[]
  initialSessionId?: string
}

export function POSMenu({ menuItems, activeSessions, initialSessionId }: POSMenuProps) {
  const [cart, setCart] = useState<{ menuItem: MenuItem; quantity: number }[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>(initialSessionId || "walkin")
  const [loading, setLoading] = useState(false)

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("All")

  // Billing parameters
  const [discount, setDiscount] = useState<number>(0)
  const [taxPercent, setTaxPercent] = useState<number>(5)
  const [notes, setNotes] = useState("")

  // Refs for shortcuts
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if (e.ctrlKey && e.key === "Backspace") {
        e.preventDefault()
        if (cart.length > 0) {
          setCart([])
          toast.success("Cart cleared")
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [cart])

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItem.id === item.id)
      if (existing) {
        return prev.map((i) =>
          i.menuItem.id === item.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { menuItem: item, quantity: 1 }]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItem.id === itemId)
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.menuItem.id === itemId
            ? { ...i, quantity: i.quantity - 1 }
            : i
        )
      }
      const itemToRemove = prev.find((i) => i.menuItem.id === itemId)
      if (itemToRemove) {
        toast("Item removed", {
          action: {
            label: "Undo",
            onClick: () => {
              setCart((c) => [...c, itemToRemove])
            },
          },
        })
      }
      return prev.filter((i) => i.menuItem.id !== itemId)
    })
  }

  const deleteCartLine = (itemId: string) => {
    const itemToRemove = cart.find((i) => i.menuItem.id === itemId)
    if (itemToRemove) {
      setCart((prev) => prev.filter((i) => i.menuItem.id !== itemId))
      toast("Item removed", {
        action: {
          label: "Undo",
          onClick: () => {
            setCart((c) => [...c, itemToRemove])
          },
        },
      })
    }
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return
    setLoading(true)

    try {
      const orderData = {
        sessionId: selectedSessionId === "walkin" ? undefined : selectedSessionId,
        items: cart.map((i) => ({
          menuItemId: i.menuItem.id,
          quantity: i.quantity,
        })),
        notes: notes || undefined,
        discount,
        tax: Number(taxAmount.toFixed(2)),
      }
      const res = await placeOrderAction(orderData)

      if (res.success) {
        const activeTable = activeSessions.find((s) => s.id === selectedSessionId)?.table.name
        toast.success(
          selectedSessionId === "walkin"
            ? res.message
            : `Order added to ${activeTable}'s tab`
        )
        setCart([])
        setSelectedSessionId("walkin")
        setNotes("")
        setDiscount(0)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("Failed to place order")
    } finally {
      setLoading(false)
    }
  }

  // Categories extraction
  const categories = ["All", ...Array.from(new Set(menuItems.map((m) => m.category.name)))]

  // Filtered menu items
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || item.category.name === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Live Bill calculations
  const subtotal = cart.reduce((acc, item) => acc + item.menuItem.basePrice * item.quantity, 0)
  const taxAmount = Math.max(0, (subtotal - discount) * (taxPercent / 100))
  const grandTotal = Math.max(0, subtotal - discount + taxAmount)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Menu & Browsing Area */}
      <div className="lg:col-span-2 space-y-4">

        {/* Search & Filter + Quick Actions */}
        <div className="flex flex-col xl:flex-row gap-3 items-start xl:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-1 w-full">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search items… (Ctrl + /)"
                className="pl-9 h-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 [&::-webkit-scrollbar]:hidden">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Quick shortcuts */}
          <div className="flex gap-1.5 shrink-0 w-full sm:w-auto">
            <Link href="/pos/manage/items">
              <Button type="button" variant="outline" size="sm" className="h-9 text-xs gap-1">
                <Plus className="h-3 w-3" /> Item
              </Button>
            </Link>
            <Link href="/pos/manage/categories">
              <Button type="button" variant="outline" size="sm" className="h-9 text-xs gap-1">
                <Plus className="h-3 w-3" /> Category
              </Button>
            </Link>
          </div>
        </div>

        {/* Menu Items Grid */}
        {filteredMenuItems.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <Search className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No items match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredMenuItems.map((item) => {
              const isOutOfStock = item.stock <= 0
              return (
                <Card
                  key={item.id}
                  className={`transition-colors group ${
                    isOutOfStock
                      ? "opacity-50 cursor-not-allowed border-dashed border-border"
                      : "cursor-pointer hover:border-muted-foreground/30"
                  }`}
                  onClick={() => {
                    if (isOutOfStock) {
                      toast.error(`"${item.name}" is currently out of stock!`)
                      return
                    }
                    addToCart(item)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                        {item.category.name}
                      </span>
                      {item.isFeatured && (
                        <span className="text-[10px] text-amber-500 font-medium">★ Popular</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-foreground mb-0.5">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mb-3">
                      {item.description || "Freshly prepared"}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground font-mono">
                        ₹{item.basePrice}
                      </span>
                      <span className={`text-[10px] font-medium font-mono ${
                        isOutOfStock
                          ? "text-rose-500 font-bold"
                          : item.stock <= 5
                          ? "text-amber-500"
                          : "text-emerald-500"
                      }`}>
                        {isOutOfStock ? "Out of Stock" : `${item.stock} left`}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Cart & Checkout Panel */}
      <div>
        <Card className="sticky top-20">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-semibold">
              <span className="flex items-center gap-1.5">
                <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
                Order
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                {cart.reduce((acc, i) => acc + i.quantity, 0)} items
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-10">
                <ShoppingCart className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Cart is empty</p>
              </div>
            ) : (
              <div className="space-y-3">

                {/* Cart Items List */}
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {cart.map((cartItem) => (
                    <div
                      key={cartItem.menuItem.id}
                      className="flex justify-between items-center group"
                    >
                      <div className="flex-1 pr-2 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {cartItem.menuItem.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          ₹{cartItem.menuItem.basePrice} × {cartItem.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeFromCart(cartItem.menuItem.id)}
                        >
                          <Minus className="h-2.5 w-2.5" />
                        </Button>
                        <span className="w-5 text-center text-xs font-semibold font-mono">
                          {cartItem.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => addToCart(cartItem.menuItem)}
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteCartLine(cartItem.menuItem.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Session Link */}
                <div className="space-y-1 pt-2 border-t border-border">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                    Link to Table
                  </Label>
                  <Select value={selectedSessionId} onValueChange={(val) => setSelectedSessionId(val ?? "walkin")}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select">
                        {(value) => {
                          if (value === "walkin") return "Walk-in"
                          const selected = activeSessions.find((s) => s.id === value)
                          return selected ? `${selected.table.name} (${selected.customer?.name || "Guest"})` : "Walk-in"
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="walkin">Walk-in</SelectItem>
                      {activeSessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          {`${session.table.name} (${session.customer?.name || "Guest"})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                    Notes
                  </Label>
                  <Textarea
                    placeholder="Special instructions…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-12 text-xs resize-none"
                  />
                </div>

                {/* Discount & Tax */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                      Discount (₹)
                    </Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={discount || ""}
                      onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                      Tax (%)
                    </Label>
                    <Input
                      type="number"
                      placeholder="5"
                      value={taxPercent || ""}
                      onChange={(e) => setTaxPercent(Math.max(0, Number(e.target.value)))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Bill Summary */}
                <div className="space-y-1 pt-2 border-t border-border text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-mono">₹{subtotal.toFixed(0)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-500">
                      <span>Discount</span>
                      <span className="font-mono">-₹{discount.toFixed(0)}</span>
                    </div>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tax ({taxPercent}%)</span>
                      <span className="font-mono">₹{taxAmount.toFixed(0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-semibold text-foreground pt-1.5 border-t border-dashed border-border">
                    <span>Total</span>
                    <span className="font-mono">₹{grandTotal.toFixed(0)}</span>
                  </div>
                </div>

                <Button
                  className="w-full h-9 text-xs font-medium mt-1"
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Processing…
                    </>
                  ) : (
                    "Place Order"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
