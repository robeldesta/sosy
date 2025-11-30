'use client'

import { ReactNode } from 'react'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramButton } from '@/components/telegram/TelegramButton'

interface EmptyStateProps {
  icon?: string | ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon = '📦',
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <TelegramCard className={`text-center py-[60px] ${className}`}>
      <div className="text-[48px] mb-[16px]">
        {typeof icon === 'string' ? icon : icon}
      </div>
      <div className="text-[17px] font-medium mb-[8px]" suppressHydrationWarning>
        {title}
      </div>
      {description && (
        <div className="text-[15px] text-[#707579] mb-[20px]" suppressHydrationWarning>
          {description}
        </div>
      )}
      {actionLabel && onAction && (
        <TelegramButton variant="primary" onClick={onAction}>
          {actionLabel}
        </TelegramButton>
      )}
    </TelegramCard>
  )
}

