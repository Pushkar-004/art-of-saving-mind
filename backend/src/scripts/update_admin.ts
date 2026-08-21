// // 
// import { prisma } from '../lib/prisma';
// import { Role } from '@prisma/client';
// import bcrypt from 'bcryptjs';


// async function updateAdmin() {

//   const email = 'admin@ppm.com';
//   const password = 'Admin@123';

//   const hash = await bcrypt.hash(password, 10);

//   const admin = await prisma.user.upsert({

//     where: {
//       email,
//     },

//     update: {
//       name: 'PPM Admin',
//       role: Role.admin,
//       passwordHash: hash,
//     },

//     create: {
//       email,
//       name: 'PPM Admin',
//       role: Role.admin,
//       passwordHash: hash,
//     },

//   });

//   console.log(`Admin ready: ${admin.email} / ${password}`);

//   await prisma.$disconnect();
// }

// updateAdmin().catch(console.error);

import { prisma } from '../lib/prisma';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function updateAdmin() {

  const email = 'admin@ppm.com';
  const password = 'Admin@123';

  const hash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({

    where: {
      email,
    },

    update: {
      name: 'PPM Admin',
      role: Role.admin,
      passwordHash: hash,
    },

    create: {
      email,
      name: 'PPM Admin',
      role: Role.admin,
      passwordHash: hash,
    },

  });

  console.log(`Admin ready: ${admin.email} / ${password}`);

  await prisma.$disconnect();
}

updateAdmin().catch(console.error);