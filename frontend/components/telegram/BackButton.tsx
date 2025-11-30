'use client'

import { useRouter } from 'next/navigation'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'

interface BackButtonProps {
  onClick?: () => void
}

export function BackButton({ onClick }: BackButtonProps) {
  const router = useRouter()
  const { webApp } = useTelegramWebApp()

  const handleClick = () => {
    webApp?.HapticFeedback?.impactOccurred('light')
    if (onClick) {
      onClick()
    } else {
      router.back()
    }
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center justify-center w-[40px] h-[40px] -ml-[8px] active:opacity-70"
      aria-label="Back"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="text-[#3390ec]"
      >
        <path
          d="M15 18L9 12L15 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

