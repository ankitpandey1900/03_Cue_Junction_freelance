# Development Roadmap

This is a living document of where I are and where I're going. I ship iteratively. I prioritize stability and billing accuracy over flashy features. 

## Phase 1: Core Foundation (COMPLETED)
- ✅ **Authentication:** Better Auth integrated with Prisma. RBAC (Admin vs Staff) enforced.
- ✅ **Table Management:** CRU(D) for Table Types and physical Tables.
- ✅ **Live Session Engine:** Accurate billing timers that survive server restarts.
- ✅ **Pause/Resume Functionality:** Added `lastPausedAt` to DB to dynamically freeze timers.
- ✅ **Performance Optimizations:** Global Next.js Suspense boundaries (`loading.tsx`) for instant dashboard transitions.

## Phase 2: Cafe & Unified Billing (COMPLETED)
- ✅ **Rebranding:** Completely stripped legacy "POS" naming conventions in favor of a unified "Cafe" module.
- ✅ **Inventory Base:** Menu categories, items, and basic stock decrementing during orders.
- ✅ **Price Snapshotting:** Financial integrity secured via snapshotting prices in `CustomerOrderItem`.
- ✅ **Unified Invoicing:** Merging Session time costs + Cafe order costs into a single checkout invoice.

## Phase 3: Immediate Next Steps (WIP)
- 🏗️ **Advanced Permissions:** Granular permissions (e.g., Staff can start sessions but only Managers can void invoices).
- 🏗️ **Booking System UI:** The backend supports bookings, but the frontend calendar view needs polish. I need conflict resolution (preventing double booking).
- 🏗️ **Loyalty Program Integration:** I have `loyaltyPoints` on the `Customer` model, but I need to implement the rules engine (e.g., earn 1 point per ₹100 spent) and allow point redemptions at checkout.

## Phase 4: Scaling & Analytics (Future)
- 🔮 **Advanced Reports:** I need a full charting dashboard using `recharts` to visualize daily revenue, table utilization rates, and top-selling cafe items.
- 🔮 **Stock Management:** Low stock alerts, supplier tracking, and automated reorder emails.
- 🔮 **Hardware Integration:** (Stretch Goal) Thermal printer integration for receipts and automated light switches (turning off the table light when the session ends).
