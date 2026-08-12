import { PrismaClient } from '@prisma/client'
import { auth } from '../lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // 1. Clear existing transactional & catalog data (Idempotent seed)
  console.log('Clearing database records...')
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
  await prisma.cafeSettings.deleteMany()

  // 2. Create Default Admin User
  const adminResult = await auth.api.signUpEmail({
    body: {
      email: 'admin@cuejunction.com',
      password: 'password123',
      name: 'Darshana Cafe Owner',
    }
  })
  if (adminResult.user) {
    await prisma.user.update({
      where: { id: adminResult.user.id },
      data: { role: 'ADMIN' }
    })
  }
  console.log('Created Admin User: admin@cuejunction.com')

  // 3. Create Default Staff User
  await auth.api.signUpEmail({
    body: {
      email: 'staff@cuejunction.com',
      password: 'password123',
      name: 'Rohan Sharma',
    }
  })
  console.log('Created Staff User: staff@cuejunction.com')

  // 4. Create Default Cafe Settings
  await prisma.cafeSettings.create({
    data: {
      cafeName: 'Cue Junction',
      defaultHourlyRate: 200,
      receiptFooterText: 'Thank you for visiting Cue Junction',
      currency: 'INR',
      taxRate: 0,
      acceptCash: true,
      acceptCard: true,
      acceptUpi: true
    }
  })
  console.log('Created Default Cafe Settings')




  // 7. Seed Cafe Menu
  const menuData = [
    {
      category: 'Pizza',
      items: [
        { name: 'Regular', price: 99, desc: 'Baked pizza with pizza sauce, capsicum, tomato, cheese' },
        { name: 'Margherita', price: 99, desc: 'Baked pizza with pizza sauce, tomato, mozzarella cheese' },
        { name: 'Fresh Veggie', price: 139, desc: 'Pizza with pizza sauce, fresh veggies, mozzarella, cheese' },
        { name: 'Cheese & Corn', price: 139, desc: 'Baked pizza with pizza sauce, corn, cheese' },
        { name: 'Italian', price: 159, desc: 'Baked pizza with Italian sauce, veggies, cheese' },
        { name: 'Paneer', price: 159, desc: 'Baked pizza with pizza sauce, paneer, onion, cheese' },
        { name: 'Maharaja', price: 169, desc: 'Baked pizza with pizza sauce, veggies, corn, paneer, cheese' }
      ]
    },
    {
      category: 'Sandwich',
      items: [
        { name: 'Regular Sandwich', price: 69, desc: 'Sandwich with spiced potato patty, fresh veggies, mayonnaise & sauce' },
        { name: 'Veg Cheese', price: 79, desc: 'Sandwich with fresh veggies, melted cheese & Indian spices' },
        { name: 'Veg Cheese Grilled', price: 89, desc: 'Grilled sandwich with fresh veggies, melted cheese & Indian spices' },
        { name: 'Veg Club', price: 99, desc: 'Triple layer sandwich with fresh veggies, veg patty, cheese, mayonnaise & Indian spices' },
        { name: 'Cheese & Corn', price: 99, desc: 'Sweet corn with cheese, chopped capsicum & cucumber, butter, mayonnaise' },
        { name: 'Veg Mayo Grilled', price: 109, desc: 'Grilled sandwich with fresh vegetables & creamy mayonnaise' },
        { name: 'Grilled Paneer Sandwich', price: 119, desc: 'Sandwich with fresh paneer, vegetables, sauce & Indian spices' },
        { name: 'Veg Schezwan Grilled', price: 119, desc: 'Grilled sandwich with fresh vegetables & spicy Schezwan sauce' }
      ]
    },
    {
      category: 'Chinese',
      items: [
        { name: 'Tomato Soup', price: 69, desc: '' },
        { name: 'Manchau Soup', price: 79, desc: '' },
        { name: 'Noodles soup', price: 89, desc: '' },
        { name: 'Veg Manchurian', price: 99, desc: '' },
        { name: 'Veg Fried Rice', price: 99, desc: '' },
        { name: 'Chinese Bhel', price: 99, desc: '' },
        { name: 'Schezwan Noodles', price: 99, desc: '' },
        { name: 'Hakka Noodles', price: 119, desc: '' },
        { name: 'Schezwan Rice', price: 119, desc: '' },
        { name: 'Paneer Fried Rice', price: 129, desc: '' },
        { name: 'Paneer Chilli', price: 129, desc: '' },
        { name: 'Veg Fried Rice + Manchurian', price: 159, desc: '' }
      ]
    },
    {
      category: 'Roll',
      items: [
        { name: 'Paneer Roll', price: 119, desc: 'Paneer, cucumber, cabbage, capsicum, onion, sauce' },
        { name: 'Vegetable Roll', price: 99, desc: 'Onion, tomato, carrot, capsicum, cucumber, sauce' },
        { name: 'Veg Mayo Roll', price: 99, desc: 'Onion, tomato, carrot, capsicum, cucumber, mayonnaise, sauce' },
        { name: 'Cheese Roll', price: 99, desc: 'Onion, tomato, carrot, capsicum, cheese, sauce' },
        { name: 'Schezwan Roll', price: 99, desc: 'Onion, tomato, carrot, capsicum, cucumber, schezwan sauce' }
      ]
    },
    {
      category: 'Burger',
      items: [
        { name: 'Classic Aloo Tikki', price: 69, desc: 'Seasoned potato patties, tomato, onion, cucumber, lettuce, mayonnaise & Indian spice blend' },
        { name: 'Veg Patty', price: 79, desc: 'Crispy patty with mashed potatoes, carrots, peas, sweet corn, lettuce, cheese slice, mayonnaise & Indian spices' },
        { name: 'Cheese Loaded', price: 89, desc: 'Crispy patty with mashed potatoes, carrots, peas, sweet corn, lettuce, cheese slice, mayonnaise, extra cheese & Indian spices' },
        { name: 'Paneer', price: 99, desc: 'Fresh paneer with herbs, spices, cheese slice, mayonnaise' }
      ]
    },
    {
      category: 'Momos',
      items: [
        { name: 'Veg Steamed Momos', price: 89, desc: '' },
        { name: 'Schezwan Momos', price: 99, desc: '' },
        { name: 'Perry Perry Momos', price: 99, desc: '' },
        { name: 'Paneer Momos', price: 109, desc: '' },
        { name: 'Cheese Momos', price: 119, desc: '' }
      ]
    },
    {
      category: 'Tea',
      items: [
        { name: 'Regular Tea', price: 20, desc: '' },
        { name: 'Ginger Tea', price: 25, desc: '' },
        { name: 'Black Tea', price: 25, desc: '' },
        { name: 'Special Tea', price: 30, desc: '' },
        { name: 'Honey Lemon Tea', price: 30, desc: '' },
        { name: 'Green Tea', price: 30, desc: '' },
        { name: 'Iced Tea', price: 35, desc: '' },
        { name: 'Bournvita Milk', price: 40, desc: '' }
      ]
    },
    {
      category: 'Drinks',
      items: [
        { name: 'Fresh Lime Soda', price: 29, desc: 'Refreshing soda with fresh lime & a tangy twist' },
        { name: 'Mint Mojito', price: 89, desc: 'Refreshing drink with mint, lime and fizzy soda' },
        { name: 'Green Apple', price: 89, desc: 'Refreshing drink with green apple & fizzy soda' },
        { name: 'Blue Curacao', price: 89, desc: 'Refreshing blue curacao flavored soda' },
        { name: 'Strawberry', price: 89, desc: 'Refreshing strawberry with soda' }
      ]
    },
    {
      category: 'Coffee',
      items: [
        { name: 'Normal Coffee', price: 30, desc: '' },
        { name: 'Black Coffee', price: 30, desc: '' },
        { name: 'Hot Chocolate', price: 50, desc: '' },
        { name: 'Iced Coffee', price: 40, desc: '' },
        { name: 'Cold Coffee', price: 45, desc: '' },
        { name: 'Thick Cold Coffee', price: 65, desc: '' },
        { name: 'Cold Coffee with Ice Cream', price: 75, desc: '' }
      ]
    },
    {
      category: 'Quick Bites',
      items: [
        { name: 'Nachos', price: 79, desc: '' },
        { name: 'Nachos Cheesy Dip', price: 89, desc: '' },
        { name: 'Nuggets', price: 99, desc: '' },
        { name: 'Cheese Ball', price: 99, desc: '' }
      ]
    },
    {
      category: 'Shakes',
      items: [
        { name: 'Chocolate Shake', price: 50, desc: '' },
        { name: 'Oreo Shake', price: 50, desc: '' },
        { name: 'Kitkat Shake', price: 50, desc: '' },
        { name: 'Vanilla Shake', price: 79, desc: '' },
        { name: 'Strawberry Shake', price: 89, desc: '' },
        { name: 'Mango Shake', price: 89, desc: '' }
      ]
    },
    {
      category: 'Breads',
      items: [
        { name: 'Bun Maska', price: 30, desc: 'Soft bun served with creamy butter' },
        { name: 'Bread Butter', price: 39, desc: 'Soft bread served with creamy butter' },
        { name: 'Bread Jam', price: 49, desc: 'Soft bread with sweet fruit jam' },
        { name: 'Garlic Bread', price: 69, desc: 'Buttery bread with garlic & herbs, toasted' },
        { name: 'Cheese Garlic Bread', price: 69, desc: 'Toasted bread with garlic, butter, melted cheese & Indian spices' },
        { name: 'Chilli Cheese Toast', price: 69, desc: 'Toasted bread with chilly, butter, melted cheese & Indian spices' }
      ]
    },
    {
      category: 'Pasta',
      items: [
        { name: 'White Sauce', price: 129, desc: '' },
        { name: 'Red Sauce', price: 139, desc: '' }
      ]
    },
    {
      category: 'Maggi',
      items: [
        { name: 'Plain Maggi', price: 45, desc: '' },
        { name: 'Vegetable Maggi', price: 60, desc: '' },
        { name: 'Cheese Maggi', price: 70, desc: '' },
        { name: 'Veg Cheese Maggi', price: 75, desc: '' },
        { name: 'Schezwan Maggi', price: 85, desc: '' },
        { name: 'Cheese Corn Maggi', price: 85, desc: '' }
      ]
    },
    {
      category: 'Fries',
      items: [
        { name: 'French Fries', price: 79, desc: '' },
        { name: 'Peri-Peri Fries', price: 89, desc: '' },
        { name: 'Cheesy Fries', price: 99, desc: '' }
      ]
    }
  ]

  let categoryIndex = 0
  for (const cat of menuData) {
    const categorySlug = cat.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const category = await prisma.menuCategory.create({
      data: {
        name: cat.category,
        slug: categorySlug,
        isActive: true,
        displayOrder: categoryIndex++
      }
    })

    let itemIndex = 0
    for (const item of cat.items) {
      // Make slug unique by prefixing the category slug
      const itemSlug = `${categorySlug}-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      const sku = `SKU-${categorySlug.toUpperCase().substring(0, 3)}-${item.name.toUpperCase().replace(/[^A-Z0-9]+/g, '').substring(0, 5)}-${Math.floor(100 + Math.random() * 900)}`
      
      await prisma.menuItem.create({
        data: {
          categoryId: category.id,
          sku,
          name: item.name,
          slug: itemSlug,
          description: item.desc || null,
          basePrice: item.price,
          displayOrder: itemIndex++,
          isAvailable: true,
          stock: 0 // Set standard stock pool for seed items
        }
      })
    }
    console.log(`Seeded Menu Category: ${cat.category} (${cat.items.length} items)`)
  }

  console.log('Database seeding finished successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
