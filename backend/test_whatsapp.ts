import { notificationService } from '@/modules/notification/notification.service';
async function test() {
  await notificationService.notifyAppointmentBooked({
    appointmentId: 'test1234',
    patientName: 'Test Patient',
    patientEmail: 'test@example.com',
    patientPhone: '9876543210',
    therapistName: 'Dr Test',
    service: 'Test Therapy',
    dateLabel: 'Today',
    time: '10:00 AM'
  });
}
test();
