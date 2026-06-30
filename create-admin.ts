import { PrismaClient } from "@prisma/client";
import { auth } from "./lib/auth";

const prisma = new PrismaClient();

async function main() {
  try {
    // Delete existing users to ensure we can recreate them with the password
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["admin@cuejunction.com", "staff@cuejunction.com"]
        }
      }
    });
    
    // Create Admin
    const admin = await auth.api.signUpEmail({
      body: {
        email: "admin@cuejunction.com",
        password: "password123",
        name: "Cafe Owner",
      }
    });
    
    // Create Staff
    await auth.api.signUpEmail({
      body: {
        email: "staff@cuejunction.com",
        password: "password123",
        name: "John Staff",
      }
    });

    // Update role for Admin in Prisma
    if (admin.user) {
       await prisma.user.update({
          where: { id: admin.user.id },
          data: { role: "ADMIN" }
       });
    }

    console.log("Users recreated successfully with passwords.");
  } catch (error) {
    console.error("Error recreating users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
