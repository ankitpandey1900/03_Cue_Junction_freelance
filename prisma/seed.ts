import { PrismaClient } from '@prisma/client'
import { auth } from '../lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Clear existing data (optional, but good for idempotent seeds)
  await prisma.activityLog.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.customerOrderItem.deleteMany()
  await prisma.customerOrder.deleteMany()
  await prisma.menuItem.deleteMany()
  await prisma.menuCategory.deleteMany()
  await prisma.session.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.table.deleteMany()
  await prisma.tableType.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.user.deleteMany()

  // 1. Create Admin User
  const admin = await auth.api.signUpEmail({
    body: {
      email: 'admin@cuejunction.com',
      password: 'password123',
      name: 'Cafe Owner',
    }
  })
  if (admin.user) {
    await prisma.user.update({
      where: { id: admin.user.id },
      data: { role: 'ADMIN' }
    })
  }
  console.log(`Created Admin User`)

  // 2. Create Staff User
  await auth.api.signUpEmail({
    body: {
      email: 'staff@cuejunction.com',
      password: 'password123',
      name: 'Elon Musk',
    }
  })
  console.log(`Created Staff User`)

  // 3. Create Table Types
  const vipPool = await prisma.tableType.create({
    data: {
      name: 'VIP Pool Table',
      hourlyRate: 200, // e.g., ₹200 per hour
    },
  })

  const standardPool = await prisma.tableType.create({
    data: {
      name: 'Standard Pool Table',
      hourlyRate: 150,
    },
  })

  const ps5Console = await prisma.tableType.create({
    data: {
      name: 'PS5 Console',
      hourlyRate: 250,
    },
  })
  console.log(`Created Table Types`)

  // 4. Create Physical Tables
  await prisma.table.createMany({
    data: [
      { name: 'Table 1 (VIP)', tableTypeId: vipPool.id },
      { name: 'Table 2', tableTypeId: standardPool.id },
      { name: 'Table 3', tableTypeId: standardPool.id },
      { name: 'Console 1 (PS5)', tableTypeId: ps5Console.id },
      { name: 'Console 2 (PS5)', tableTypeId: ps5Console.id },
    ],
  })
  console.log(`Created Physical Tables`)

  // 5. Create Menu Categories
  const catSnacks = await prisma.menuCategory.create({
    data: { name: 'Snacks & Starters', slug: 'snacks-starters', displayOrder: 1 }
  })
  const catMains = await prisma.menuCategory.create({
    data: { name: 'Main Course', slug: 'main-course', displayOrder: 2 }
  })
  const catBeverages = await prisma.menuCategory.create({
    data: { name: 'Beverages', slug: 'beverages', displayOrder: 3 }
  })
  console.log(`Created Menu Categories`)

  // 6. Create Menu Items
  await prisma.menuItem.createMany({
    data: [
      {
        categoryId: catSnacks.id,
        sku: 'SNK-FRIES',
        name: 'French Fries',
        slug: 'french-fries',
        basePrice: 90,
        preparationTime: 10,
        displayOrder: 1,
        isAvailable: true,
      },
      {
        categoryId: catSnacks.id,
        sku: 'SNK-GBREAD',
        name: 'Cheese Garlic Bread',
        slug: 'cheese-garlic-bread',
        basePrice: 120,
        preparationTime: 12,
        displayOrder: 2,
        isAvailable: true,
      },
      {
        categoryId: catMains.id,
        sku: 'MC-MPIZZA',
        name: 'Margherita Pizza',
        slug: 'margherita-pizza',
        basePrice: 250,
        preparationTime: 20,
        displayOrder: 1,
        isAvailable: true,
        isFeatured: true,
      },
      {
        categoryId: catBeverages.id,
        sku: 'DRK-CCOFFEE',
        name: 'Cold Coffee',
        slug: 'cold-coffee',
        basePrice: 120,
        preparationTime: 5,
        displayOrder: 1,
        isAvailable: true,
      },
      {
        categoryId: catBeverages.id,
        sku: 'DRK-PEPSI',
        name: 'Pepsi 300ml',
        slug: 'pepsi-300ml',
        basePrice: 40,
        preparationTime: 1,
        displayOrder: 2,
        isAvailable: true,
      }
    ],
  })
  console.log(`Created Menu Items`)

  console.log('Seeding finished successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
