import { z } from 'zod';

// POST /api/ai/chat
export const chatSchema = z.object({
  body: z.object({
    message: z
      .string()
      .trim()
      .min(1, 'Message cannot be empty')
      .max(2000, 'Message is too long (max 2000 characters)'),
  }),
});

export type ChatInput = z.infer<typeof chatSchema>['body'];
