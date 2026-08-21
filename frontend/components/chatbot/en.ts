import type { QuickAction } from './types'

export const en = {
  assistantName: 'Art of Saving Mind Assistant',
  headerSubtitle: "I'm here to help",
  welcome:
    "👋 Hello!\n\nWelcome to Art of Saving Mind.\n\nI'm your virtual assistant.\n\nI can help you learn about our counselling services, booking appointments, contact information, resources, and frequently asked questions.\n\nHow may I help you today?",
  quickActionsLabel: 'Quick Actions',
  inputPlaceholder: 'Type your message…',
  send: 'Send',
  openChat: 'Chat with us',
  closeChat: 'Close chat',
  typing: 'Typing…',
  fallback:
    "I'm sorry, I don't have information about that.\n\nPlease visit our Contact page or connect directly with Miss. Pooja Sunil Ghadge. She will be happy to assist you personally.",
  fallbackButton: 'Go to Contact Page',
  crisisTitle: "You're not alone",
  crisisBody: 'It sounds like things may be really hard right now. If you are in immediate danger, please reach out for help right away.',
  crisisHelplineLabel: 'National Emergency Helpline',
  crisisContactButton: "Contact Pooja Ma'am",
  crisisDisclaimer: "This assistant can't provide medical advice — please reach out to a professional or someone you trust.",
  footerDisclaimer: 'Static assistant · general information only',
} as const

export const quickActionsEn: QuickAction[] = [
  { id: 'service-counselling', labelEn: 'Counselling & Therapy', labelMr: 'समुपदेशन' },
  { id: 'service-child', labelEn: 'Child Counselling', labelMr: 'बाल समुपदेशन' },
  { id: 'service-career', labelEn: 'Career Guidance', labelMr: 'करिअर मार्गदर्शन' },
  { id: 'service-marital', labelEn: 'Marital Counselling', labelMr: 'वैवाहिक समुपदेशन' },
  { id: 'service-relationship', labelEn: 'Relationship Counselling', labelMr: 'नातेसंबंध समुपदेशन' },
  { id: 'booking', labelEn: 'Book Appointment', labelMr: 'अपॉइंटमेंट' },
  { id: 'contact', labelEn: "Contact Pooja Ma'am", labelMr: 'पूजा मॅडमशी संपर्क' },
  { id: 'resources', labelEn: 'Resources', labelMr: 'संसाधने' },
  { id: 'emergency', labelEn: 'Emergency Help', labelMr: 'आपत्कालीन मदत' },
]
