'use client'

import { useCallback } from 'react'
import { useLanguage } from '@/lib/context/LanguageContext'
import { translate } from '@/lib/i18n/index'

/**
 * Returns a `t(key, vars?)` function bound to the current language.
 * Falls back per-key: mr -> hi -> en, hi -> en. If a key is missing
 * everywhere, the key itself is returned so gaps are easy to spot.
 *
 * Usage: const { t } = useT()
 *        t('common.save')
 *        t('appointment.greeting', { name: 'Asha' })
 */
export function useT() {
  const { language } = useLanguage()

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(language, key, vars),
    [language],
  )

  return { t, language }
}
