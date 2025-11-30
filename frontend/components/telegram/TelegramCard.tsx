'use client'

import { ReactNode } from 'react'

interface TelegramCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function TelegramCard({ children, className = '', onClick }: TelegramCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white dark:bg-[#212121] 
        rounded-[12px] 
        p-[14px]
        shadow-sm
        ${onClick ? 'cursor-pointer active:opacity-70 transition-opacity' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

