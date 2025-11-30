'use client'

import { ReactNode } from 'react'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'

interface TelegramButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  className?: string
  fullWidth?: boolean
}

export function TelegramButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
  fullWidth = false,
}: TelegramButtonProps) {
  const { webApp, themeParams } = useTelegramWebApp()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && onClick) {
      webApp?.HapticFeedback?.impactOccurred('medium')
      // Blur the button after click to remove active state
      e.currentTarget.blur()
      onClick()
    }
  }

  const baseStyles = `
    rounded-full
    px-[20px] py-[10px]
    text-[17px] font-medium
    transition-opacity
    active:opacity-80
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${fullWidth ? 'w-full' : ''}
  `

  const variantStyles = {
    primary: `
      ${themeParams.button_color ? '' : 'bg-[#3390ec]'}
      ${themeParams.button_text_color ? '' : 'text-white'}
      hover:opacity-90
    `,
    secondary: `
      bg-[#f0f0f0] dark:bg-[#2a2a2a]
      text-[#3390ec] dark:text-[#5d9cec]
      hover:bg-[#e5e5e5] dark:hover:bg-[#333333]
    `,
    danger: `
      bg-[#ff3b30]
      text-white
      hover:opacity-90
    `,
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={{
        backgroundColor: variant === 'primary' && themeParams.button_color 
          ? themeParams.button_color 
          : undefined,
        color: variant === 'primary' && themeParams.button_text_color 
          ? themeParams.button_text_color 
          : undefined,
      }}
    >
      {children}
    </button>
  )
}

