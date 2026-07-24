import { en } from './en'
import { hi } from './hi'
import { mr } from './mr'
import { Language, defaultLanguage } from './config'

// Raw dictionaries, keyed by language code.
const dictionaries: Record<Language, Record<string, unknown>> = {
  en,
  hi,
  mr,
}

// Per-key fallback chain: a missing key in Marathi falls back to Hindi,
// then to English. A missing key in Hindi falls back to English.
// English has no fallback — it is the source of truth.
const fallbackChain: Record<Language, Language[]> = {
  en: [],
  hi: ['en'],
  mr: ['hi', 'en'],
}

/**
 * Resolve a dot-notation path (e.g. "auth.login") against a dictionary.
 * Returns undefined if any segment along the path is missing.
 */
function resolvePath(dict: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.')
  let current: unknown = dict
  for (const part of parts) {
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }
  return typeof current === 'string' ? current : undefined
}

/**
 * Look up a translation key for the given language, walking the
 * fallback chain (mr -> hi -> en, hi -> en) if the key is missing in
 * the requested language. Returns the key itself as a last resort so
 * missing translations are visible/debuggable rather than blank.
 */
export function translate(lang: Language, key: string, vars?: Record<string, string | number>): string {
  const candidates: Language[] = [lang, ...fallbackChain[lang]]

  let result: string | undefined
  for (const candidate of candidates) {
    const dict = dictionaries[candidate]
    if (!dict) continue
    result = resolvePath(dict, key)
    if (result !== undefined) break
  }

  if (result === undefined) {
    // No translation found anywhere in the chain — surface the key so
    // it's easy to spot in development rather than rendering blank text.
    return key
  }

  if (vars) {
    return Object.entries(vars).reduce(
      (acc, [varName, varValue]) => acc.split(`{{${varName}}}`).join(String(varValue)),
      result,
    )
  }

  return result
}

/** @deprecated kept for backward compatibility — prefer translate()/useT() */
export const getTranslation = (lang: Language) => {
  return dictionaries[lang] || dictionaries[defaultLanguage]
}

/** @deprecated kept for backward compatibility — prefer useT() */
export const useTranslation = (lang: Language) => {
  return getTranslation(lang)
}

export type { Language }
export { defaultLanguage }
