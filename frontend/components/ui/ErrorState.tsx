'use client'

import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramButton } from '@/components/telegram/TelegramButton'

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
}

export function ErrorState({
  title,
  message,
  onRetry,
  retryLabel = 'Retry',
}: ErrorStateProps) {
  return (
    <TelegramCard className="text-center py-[60px]">
      <div className="text-[48px] mb-[16px]">⚠️</div>
      {title && (
        <div className="text-[17px] font-medium mb-[8px]" suppressHydrationWarning>
          {title}
        </div>
      )}
      <div className="text-[15px] text-[#707579] mb-[20px]" suppressHydrationWarning>
        {message}
      </div>
      {onRetry && (
        <TelegramButton variant="primary" onClick={onRetry}>
          {retryLabel}
        </TelegramButton>
      )}
    </TelegramCard>
  )
}

