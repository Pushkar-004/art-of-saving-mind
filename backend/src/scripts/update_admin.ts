import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function updateAdmin() {
  const admin = await prisma.user.findFirst({
    where: { role: 'admin' }
  });

  const hash = await bcrypt.hash('Ajay@004', 10);

  if (!admin) {
    console.log("No admin found. Creating one...");
    await prisma.user.create({
      data: {
        email: 'itachi7631@gmail.com',
        name: 'Admin',
        role: 'admin',
        passwordHash: hash
      }
    });
    console.log("Admin created.");
  } else {
    console.log("Admin found. Updating...");
    await prisma.user.update({
      where: { id: admin.id },
      data: {
        email: 'itachi7631@gmail.com',
        passwordHash: hash
      }
    });
    console.log("Admin updated.");
  }
  await prisma.$disconnect();
}

updateAdmin().catch(console.error);
