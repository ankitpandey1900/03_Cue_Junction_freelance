"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Link from "next/link"
import { placeOrderAction } from "../actions/cafe.actions"
import { Plus, Minus, ShoppingCart, Search, Trash2, Loader2, Sparkles, ChefHat, Tag, ShoppingBag, X } from "lucide-react"
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

interface CafeMenuProps {
  menuItems: MenuItem[]
  activeSessions: ActiveSession[]
  initialSessionId?: string
}

export function CafeMenu({ menuItems, activeSessions, initialSessionId }: CafeMenuProps) {
  const [cart, setCart] = useState<{ menuItem: MenuItem; quantity: number }[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>(initialSessionId || "walkin")
  const [loading, setLoading] = useState(false)

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("All")

  // Billing parameters
  const [discount, setDiscount] = useState<number>(0)
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
    const existing = cart.find((i) => i.menuItem.id === item.id)
    
    // Stock limit safety check
    if (existing && existing.quantity >= item.stock) {
      toast.error(`Only ${item.stock} units of "${item.name}" are available in stock!`)
      return
    }

    toast.success(`Added ${item.name} to cart`)

    setCart((prev) => {
      const existingItem = prev.find((i) => i.menuItem.id === item.id)
      if (existingItem) {
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
        tax: 0,
      }
      const res = await placeOrderAction(orderData)

      if (res.success) {
        const activeTable = activeSessions.find((s) => s.id === selectedSessionId)?.table.name
        toast.success(
          selectedSessionId === "walkin"
            ? res.message
            : `Order added to ${activeTable}'s bill!`
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

  // Filtered and keyword-scored menu items
  const filteredMenuItems = menuItems
    .map((item) => {
      let score = 0
      const query = searchQuery.trim().toLowerCase()

      if (!query) {
        return { item, score: 1 } // Base score when search is empty
      }

      const tokens = query.split(/\s+/).filter(Boolean)
      const name = item.name.toLowerCase()
      const desc = (item.description || "").toLowerCase()
      const cat = item.category.name.toLowerCase()
      const sku = item.sku.toLowerCase()

      // Verify that EVERY token matches at least one field of the item
      const matchesAllTokens = tokens.every((token) => {
        const matchesName = name.includes(token)
        const matchesSku = sku.includes(token)
        const matchesCat = cat.includes(token)
        const matchesDesc = desc.includes(token)

        if (matchesName) score += 10
        if (matchesSku) score += 8
        if (matchesCat) score += 5
        if (matchesDesc) score += 2

        return matchesName || matchesSku || matchesCat || matchesDesc
      })

      return { item, score: matchesAllTokens ? score : 0 }
    })
    .filter((entry) => {
      const matchesCategory = selectedCategory === "All" || entry.item.category.name === selectedCategory
      return entry.score > 0 && matchesCategory
    })
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item)

  // Live Bill calculations
  const subtotal = cart.reduce((acc, item) => acc + item.menuItem.basePrice * item.quantity, 0)
  const grandTotal = Math.max(0, subtotal - discount)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Menu & Browsing Area */}
      <div className="lg:col-span-2 space-y-5">

        {/* Search, Filter & Quick Custom Actions */}
        <div className="flex flex-col gap-4 bg-card/45 backdrop-blur-md p-4 rounded-xl border border-border/60">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search food, drinks, or SKU... (Ctrl + /)"
                className="pl-10 h-10 text-xs md:text-sm bg-background/50 border-border/80 focus-visible:ring-primary/60"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Quick shortcuts */}
            <div className="flex gap-2 shrink-0">
              <Link href="/cafe/manage/items">
                <Button type="button" variant="outline" size="sm" className="h-10 text-xs gap-1.5 font-medium hover:bg-muted/65">
                  <Plus className="h-3.5 w-3.5" /> Add Food
                </Button>
              </Link>
              <Link href="/cafe/manage/categories">
                <Button type="button" variant="outline" size="sm" className="h-10 text-xs gap-1.5 font-medium hover:bg-muted/65">
                  <Plus className="h-3.5 w-3.5" /> Category
                </Button>
              </Link>
            </div>
          </div>

          {/* Scrolling Categories Bar */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none mask-image-horizontal">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat
              return (
                <button
                  key={cat}
                  type="button"
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20 scale-[1.03]"
                      : "bg-background/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground border-border/60"
                  }`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>

        {/* Menu Items Grid */}
        {filteredMenuItems.length === 0 ? (
          <div className="text-center py-16 bg-card/20 border border-dashed border-border/80 rounded-xl">
            <ChefHat className="h-8 w-8 text-muted-foreground/60 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No menu items found</p>
            <p className="text-xs text-muted-foreground mt-1">Try updating your filters or search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredMenuItems.map((item) => {
              const isOutOfStock = item.stock <= 0
              const isLowStock = !isOutOfStock && item.stock <= 5
              
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isOutOfStock) {
                      toast.error(`"${item.name}" is currently out of stock!`)
                      return
                    }
                    addToCart(item)
                  }}
                  className={`group relative overflow-hidden rounded-xl border transition-all duration-300 ${
                    isOutOfStock
                      ? "opacity-55 bg-muted/20 border-border cursor-not-allowed"
                      : "bg-card/45 hover:bg-card/90 border-border/60 hover:border-primary/40 shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                  }`}
                >
                  {/* Glass highlight overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  <div className="p-4 flex flex-col justify-between h-full relative z-10 min-h-[135px]">
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between">
                        <span className="text-[9px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-md">
                          {item.category.name}
                        </span>
                        {item.isFeatured && (
                          <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                            <Sparkles className="h-2.5 w-2.5" /> Popular
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                          {item.description || "Freshly cooked to order."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-border/40">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Price</span>
                        <span className="text-sm font-extrabold text-foreground font-mono">
                          ₹{item.basePrice}
                        </span>
                      </div>

                      {/* Stock badge & Plus Action */}
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                          isOutOfStock
                            ? "text-rose-500 bg-rose-500/15"
                            : isLowStock
                            ? "text-amber-500 bg-amber-500/15"
                            : "text-emerald-500 bg-emerald-500/15"
                        }`}>
                          {isOutOfStock ? "SOLD OUT" : `${item.stock} Left`}
                        </span>

                        {!isOutOfStock && (
                          <div className="h-7 w-7 rounded-lg bg-primary/10 group-hover:bg-primary text-primary group-hover:text-primary-foreground flex items-center justify-center transition-all">
                            <Plus className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Cart & Checkout Panel */}
      <div className="space-y-4 order-first lg:order-last mb-4 lg:mb-0">
        <Card className="sticky top-20 bg-card/65 backdrop-blur-lg border-border/70 shadow-lg overflow-hidden">
          {/* Cart Header */}
          <div className="p-4 border-b border-border/60 bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-bold text-foreground">Current Order</h3>
                <p className="text-[10px] text-muted-foreground font-medium">Checkout list</p>
              </div>
            </div>
            {cart.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCart([])
                  toast.success("Cart cleared")
                }}
                className="h-8 text-[10px] font-bold text-destructive hover:bg-destructive/10 gap-1.5"
              >
                <Trash2 className="h-3 w-3" /> Clear
              </Button>
            )}
          </div>

          <CardContent className="p-4 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <ShoppingBag className="h-7 w-7 text-muted-foreground/50 mx-auto" />
                <p className="text-xs font-semibold text-muted-foreground">Cart is empty</p>
                <p className="text-[10px] text-muted-foreground/80">Tap menu items to add them here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Cart Items List */}
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {cart.map((cartItem) => (
                    <div
                      key={cartItem.menuItem.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-background/40 border border-border/40 hover:border-border transition-colors group"
                    >
                      <div className="flex-1 pr-3 min-w-0">
                        <h5 className="text-xs font-bold text-foreground truncate">
                          {cartItem.menuItem.name}
                        </h5>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          ₹{cartItem.menuItem.basePrice} × {cartItem.quantity}
                        </p>
                      </div>

                      {/* Quantity Toggles */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-md bg-background/50 hover:bg-muted"
                          onClick={() => removeFromCart(cartItem.menuItem.id)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-5 text-center text-xs font-bold font-mono">
                          {cartItem.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-md bg-background/50 hover:bg-muted"
                          onClick={() => addToCart(cartItem.menuItem)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                          onClick={() => deleteCartLine(cartItem.menuItem.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Target Bill Selection */}
                <div className="space-y-1.5 pt-3 border-t border-border/40">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">
                    Link to Table Tab
                  </Label>
                  <Select value={selectedSessionId} onValueChange={(val) => setSelectedSessionId(val ?? "walkin")}>
                    <SelectTrigger className="h-9 text-xs bg-background/40 border-border/70 focus:ring-primary/60">
                      <SelectValue placeholder="Select target bill">
                        {selectedSessionId === "walkin" 
                          ? "🚶 Walk-in Customer (Instant Bill)" 
                          : activeSessions.find((s) => s.id === selectedSessionId) 
                            ? `🎮 ${activeSessions.find((s) => s.id === selectedSessionId)?.table.name} (${activeSessions.find((s) => s.id === selectedSessionId)?.customer?.name || "Guest"})` 
                            : null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="walkin">🚶 Walk-in Customer (Instant Bill)</SelectItem>
                      {activeSessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          🎮 {session.table.name} ({session.customer?.name || "Guest"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">
                    Special Kitchen Notes
                  </Label>
                  <Textarea
                    placeholder="E.g., No onions, extra spicy, warm coffee..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-14 text-xs resize-none bg-background/40 border-border/70 focus-visible:ring-primary/60"
                  />
                </div>

                {/* Discount */}
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">
                    Flat Discount (₹)
                  </Label>
                  <div className="relative">
                    <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="0"
                      value={discount || ""}
                      onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                      className="h-8 pl-8 text-xs font-mono bg-background/40 border-border/70 focus-visible:ring-primary/60"
                    />
                  </div>
                </div>

                {/* Bill Summary */}
                <div className="space-y-2 pt-3 border-t border-border/50 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span className="font-medium">Subtotal</span>
                    <span className="font-semibold font-mono">₹{subtotal.toFixed(0)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-500 font-medium">
                      <span>Discount</span>
                      <span className="font-semibold font-mono">-₹{discount.toFixed(0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-foreground pt-2 border-t border-dashed border-border/40">
                    <span>Total Amount</span>
                    <span className="font-mono text-primary text-base">₹{grandTotal.toFixed(0)}</span>
                  </div>
                </div>

                <Button
                  className="w-full h-10 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm shadow-primary/10 transition-all rounded-lg mt-1"
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Placing Order…
                    </>
                  ) : (
                    "Confirm & Place Order"
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
