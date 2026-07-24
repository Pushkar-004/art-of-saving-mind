import { NotificationType } from '@prisma/client';

// Mirrors the shape the frontend's notification list/badge consumes.
// Kept additive/simple — no derived display strings here (unlike
// AppointmentDTO) since notifications are short, already human-
// readable title/message pairs generated at creation time.
export interface NotificationDTO {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedAppointmentId: string | null;
  isRead: boolean;
  createdAt: string; // ISO timestamp
}
