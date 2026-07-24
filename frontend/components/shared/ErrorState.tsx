'use client'

import { AlertTriangle, RotateCcw } from 'lucide-react'
import { useT } from '@/lib/i18n/useT'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}

export default function ErrorState({
  title,
  description,
  onRetry,
  className = '',
}: ErrorStateProps) {
  const { t } = useT()
  const resolvedTitle = title ?? t('shared.errorTitle')
  const resolvedDescription = description ?? t('shared.errorDescription')

  return (
    <div
      role="alert"
      className={`glass-card flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}
    >
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle size={26} />
      </span>
      <h3 className="mt-4 text-base font-semibold text-foreground">{resolvedTitle}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground text-pretty">
        {resolvedDescription}
      </p>
      {onRetry && (
        <button onClick={onRetry} className="glass-button-outline mt-5">
          <RotateCcw size={16} />
          {t('common.tryAgain')}
        </button>
      )}
    </div>
  )
}
