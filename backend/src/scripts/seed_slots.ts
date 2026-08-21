import { DayOfWeek } from '@prisma/client';
import { prisma } from '../lib/prisma';

async function seedSlots() {
  console.log('Clearing old availability slots...');
  await prisma.availabilitySlot.deleteMany({});

  const days: DayOfWeek[] = [
    DayOfWeek.sunday,
    DayOfWeek.monday,
    DayOfWeek.tuesday,
    DayOfWeek.wednesday,
    DayOfWeek.thursday,
    DayOfWeek.friday,
    DayOfWeek.saturday,
  ];

  const timeRanges = [
    { start: '09:00', end: '10:00' },
    { start: '10:30', end: '11:30' },
    { start: '12:00', end: '13:00' },
    { start: '14:00', end: '15:00' },
    { start: '15:30', end: '16:30' },
    { start: '17:00', end: '18:00' },
    { start: '18:30', end: '19:30' },
    { start: '20:00', end: '21:00' },
  ];

  console.log('Seeding availability slots for all 7 days of the week...');
  for (const dayOfWeek of days) {
    for (const range of timeRanges) {
      await prisma.availabilitySlot.create({
        data: {
          dayOfWeek,
          startTime: range.start,
          endTime: range.end,
          isEnabled: true,
        },
      });
    }
  }

  const count = await prisma.availabilitySlot.count();
  console.log(`Successfully seeded ${count} availability slots.`);

  // Also create a test patient user and booking appointment if needed for easy testing
  let patientUser = await prisma.user.findUnique({
    where: { email: 'patient@example.com' },
  });

  if (!patientUser) {
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash('Password@123', 10);
    patientUser = await prisma.user.create({
      data: {
        email: 'patient@example.com',
        name: 'Rahul Mehta',
        phone: '+91 9876543210',
        role: 'patient',
        passwordHash: hash,
        patient: {
          create: {
            primaryConcern: 'Counselling & Therapy',
          },
        },
      },
    });
    console.log('Created test patient user: patient@example.com (pass: Password@123)');
  }

  // Create a pending appointment for testing payment workflows
  const patient = await prisma.patient.findUnique({
    where: { userId: patientUser.id },
  });

  if (patient) {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const existingAppt = await prisma.appointment.findFirst({
      where: { patientId: patient.id, date: new Date(dateStr), startTime: '15:30' },
    });

    if (!existingAppt) {
      const appt = await prisma.appointment.create({
        data: {
          patientId: patient.id,
          service: 'Counselling & Therapy',
          date: new Date(dateStr),
          startTime: '15:30',
          endTime: '16:30',
          mode: 'online',
          status: 'pending',
          notes: 'Test appointment created for checking out payment flows.',
        },
      });
      console.log(`Created test appointment ID: ${appt.id} (Service: Counselling & Therapy, Date: ${dateStr}, Time: 15:30 - 16:30)`);
    } else {
      console.log(`Test appointment already exists: ${existingAppt.id}`);
    }
  }

  await prisma.$disconnect();
}

seedSlots().catch((err) => {
  console.error(err);
  process.exit(1);
});
