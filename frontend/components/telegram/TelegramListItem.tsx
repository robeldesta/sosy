'use client'

import { ReactNode } from 'react'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'

interface TelegramListItemProps {
  title: string
  subtitle?: string
  rightElement?: ReactNode
  onClick?: () => void
  className?: string
}

export function TelegramListItem({ 
  title, 
  subtitle, 
  rightElement, 
  onClick,
  className = '' 
}: TelegramListItemProps) {
  const { webApp } = useTelegramWebApp()

  const handleClick = () => {
    if (onClick) {
      webApp?.HapticFeedback?.impactOccurred('light')
      onClick()
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`
        flex items-center justify-between
        py-[10px]
        ${onClick ? 'cursor-pointer active:opacity-70' : ''}
        ${className}
      `}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[17px] leading-[22px] font-normal text-[#000] dark:text-[#fff]" suppressHydrationWarning>
          {title}
        </div>
        {subtitle && (
          <div className="text-[14px] leading-[18px] text-[#707579] dark:text-[#707579] mt-[1px]" suppressHydrationWarning>
            {subtitle}
          </div>
        )}
      </div>
      {rightElement && (
        <div className="ml-[12px] flex items-center shrink-0">
          {rightElement}
        </div>
      )}
    </div>
  )
}

