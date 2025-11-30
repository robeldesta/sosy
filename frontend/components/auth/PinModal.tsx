'use client'

import { useTranslation } from 'react-i18next'
import { useState, useRef, useEffect } from 'react'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramButton } from '@/components/telegram/TelegramButton'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'

interface PinModalProps {
  onSuccess: () => void
  onCancel?: () => void
}

export function PinModal({ onSuccess, onCancel }: PinModalProps) {
  const { t } = useTranslation()
  const { webApp } = useTelegramWebApp()
  const [pin, setPin] = useState<string[]>(['', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return
    if (!/^\d*$/.test(value)) return

    const newPin = [...pin]
    newPin[index] = value
    setPin(newPin)

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }

    if (newPin.every(digit => digit !== '') && newPin.join('').length === 4) {
      handleSubmit(newPin.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (pinValue: string) => {
    // Verify PIN with backend
    try {
      const { apiClient } = await import('@/lib/api/client')
      const response = await apiClient.post('/auth/verify-pin', { pin: pinValue })
      
      if (response.data.valid) {
        webApp?.HapticFeedback?.notificationOccurred('success')
        onSuccess()
      } else {
        webApp?.HapticFeedback?.notificationOccurred('error')
        setPin(['', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (error) {
      webApp?.HapticFeedback?.notificationOccurred('error')
      setPin(['', '', '', ''])
      inputRefs.current[0]?.focus()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center px-[20px]">
      <TelegramCard className="w-full max-w-[320px]">
        <div className="text-center py-[20px]">
          <h2 className="text-[20px] font-semibold mb-[16px]" suppressHydrationWarning>
            {t('auth.enterPin')}
          </h2>
          
          <div className="flex gap-[12px] justify-center mb-[24px]">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-[48px] h-[56px] text-center text-[24px] font-semibold bg-[#f0f0f0] dark:bg-[#2a2a2a] border-2 border-[#e5e5e5] dark:border-[#3a3a3a] rounded-[12px] focus:outline-none focus:border-[#3390ec]"
              />
            ))}
          </div>

          {onCancel && (
            <TelegramButton variant="secondary" fullWidth onClick={onCancel}>
              {t('common.cancel')}
            </TelegramButton>
          )}
        </div>
      </TelegramCard>
    </div>
  )
}

