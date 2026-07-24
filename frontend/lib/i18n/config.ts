export const languages = {
  en: 'English',
  hi: 'हिंदी',
  mr: 'मराठी',
} as const

export type Language = keyof typeof languages

export const defaultLanguage: Language = 'en'
