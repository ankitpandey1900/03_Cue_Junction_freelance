import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function runTests() {
  console.log("--------------------------------------------------")
  console.log("🧪 STARTING CAFE F&B MODULE INTEGRITY TESTS...")
  console.log("--------------------------------------------------")

  try {
    // 1. Create a Test Category
    console.log("1. Creating Test Category...")
    const category = await prisma.menuCategory.create({
      data: {
        name: "Test Drinks",
        slug: "test-drinks-temp-" + Date.now(),
        displayOrder: 99,
        isActive: true,
      }
    })
    console.log("   ✅ Category created:", category.name)

    // 2. Create a Test MenuItem with base price ₹100
    console.log("2. Creating MenuItem (Price: ₹100)...")
    const item = await prisma.menuItem.create({
      data: {
        categoryId: category.id,
        sku: "TEST-DRK-" + Date.now(),
        name: "Test Energy Drink",
        slug: "test-energy-drink-temp-" + Date.now(),
        basePrice: 100,
        preparationTime: 5,
        displayOrder: 1,
        isAvailable: true,
        isFeatured: false,
      }
    })
    console.log("   ✅ MenuItem created with base price: ₹" + item.basePrice)

    // 3. Create a CustomerOrder with 2 quantities of the item
    console.log("3. Placing CustomerOrder (Quantity: 2)...")
    const subtotal = item.basePrice * 2
    const discount = 10
    const tax = 9.5
    const total = subtotal - discount + tax

    const order = await prisma.customerOrder.create({
      data: {
        status: "PENDING",
        subtotal,
        discount,
        tax,
        total,
        notes: "Test order",
        orderItems: {
          create: [
            {
              menuItemId: item.id,
              itemNameSnapshot: item.name,
              categorySnapshot: category.name,
              unitPriceSnapshot: item.basePrice,
              quantity: 2,
              totalPrice: subtotal,
            }
          ]
        }
      },
      include: {
        orderItems: true
      }
    })
    console.log("   ✅ Order placed successfully. Total: ₹" + order.total)

    // 4. Update the MenuItem's price from ₹100 to ₹150 (price increase)
    console.log("4. Updating MenuItem price to ₹150 (simulating owner pricing update)...")
    const updatedItem = await prisma.menuItem.update({
      where: { id: item.id },
      data: { basePrice: 150 }
    })
    console.log("   ✅ MenuItem price updated to: ₹" + updatedItem.basePrice)

    // 5. Verify that the previous order still references the original ₹100 price snapshot
    console.log("5. Checking Historical Snapshot Integrity...")
    const fetchedOrder = await prisma.customerOrder.findUnique({
      where: { id: order.id },
      include: { orderItems: true }
    })

    if (!fetchedOrder) throw new Error("Placed order not found in DB")
    
    const orderItem = fetchedOrder.orderItems[0]
    console.log("   📋 Historical Order Item Name:", orderItem.itemNameSnapshot)
    console.log("   📋 Original Snapshot Unit Price: ₹" + orderItem.unitPriceSnapshot)
    console.log("   📋 Current Product Price: ₹" + updatedItem.basePrice)

    if (orderItem.unitPriceSnapshot === 100) {
      console.log("   ✅ TEST PASSED: Historical pricing snapshot is preserved!")
    } else {
      throw new Error("TEST FAILED: Historical pricing snapshot was altered!")
    }

    // 6. Clean up
    console.log("6. Cleaning up test data...")
    await prisma.customerOrderItem.delete({ where: { id: orderItem.id } })
    await prisma.customerOrder.delete({ where: { id: order.id } })
    await prisma.menuItem.delete({ where: { id: item.id } })
    await prisma.menuCategory.delete({ where: { id: category.id } })
    console.log("   ✅ Test data cleaned up successfully.")
    
    console.log("--------------------------------------------------")
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! F&B MODULE IS ROBUST.")
    console.log("--------------------------------------------------")
  } catch (error) {
    console.error("❌ TEST ENCOUNTERED CRITICAL ERROR:", error)
  } finally {
    await prisma.$disconnect()
  }
}

runTests()
