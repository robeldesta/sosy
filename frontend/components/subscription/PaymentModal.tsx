'use client'

import { useState } from 'react'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { TelegramButton } from '@/components/telegram/TelegramButton'
import { subscriptionApi, InitPaymentRequest } from '@/lib/api/subscription'
import { showToast } from '@/lib/utils/toast'

interface PaymentModalProps {
  planCode: string
  planName: string
  price: number
  currency: string
  billingCycle: 'monthly' | 'yearly'
  onClose: () => void
  onSuccess: () => void
}

export function PaymentModal({
  planCode,
  planName,
  price,
  currency,
  billingCycle,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const { webApp } = useTelegramWebApp()
  const [selectedProvider, setSelectedProvider] = useState<'telebirr' | 'chapa' | 'paypal' | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePayment = async () => {
    if (!selectedProvider) {
      showToast('Please select a payment method', 'error')
      return
    }

    setIsProcessing(true)
    try {
      const paymentData: InitPaymentRequest = {
        plan_code: planCode,
        payment_provider: selectedProvider,
        billing_cycle: billingCycle,
      }

      const response = await subscriptionApi.initiatePayment(paymentData)

      // Open payment URL in Telegram
      if (webApp && 'openLink' in webApp && typeof (webApp as any).openLink === 'function') {
        (webApp as any).openLink(response.payment_url)
      } else {
        // Fallback: open in new window
        window.open(response.payment_url, '_blank')
      }

      showToast('Redirecting to payment...', 'info')
      onSuccess()
      onClose()
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'Payment initiation failed', 'error')
      setIsProcessing(false)
    }
  }

  const paymentMethods = [
    {
      id: 'telebirr' as const,
      name: 'Telebirr',
      icon: '📱',
      description: 'Mobile Money',
    },
    {
      id: 'chapa' as const,
      name: 'Chapa',
      icon: '💳',
      description: 'Card & Mobile Money',
    },
    {
      id: 'paypal' as const,
      name: 'PayPal',
      icon: '🌐',
      description: 'International Payments',
    },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="w-full bg-[var(--tg-theme-bg-color,#ffffff)] rounded-t-[20px] p-4 pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-semibold text-[var(--tg-theme-text-color,#000000)]">
            Select Payment Method
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)]"
          >
            <svg
              className="w-5 h-5 text-[var(--tg-theme-text-color,#000000)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Plan Info */}
        <div className="bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)] rounded-[12px] p-4 mb-6">
          <div className="text-[15px] text-[var(--tg-theme-hint-color,#999999)] mb-1">
            {planName}
          </div>
          <div className="text-[24px] font-bold text-[var(--tg-theme-text-color,#000000)]">
            {currency} {price.toLocaleString()}
            <span className="text-[15px] font-normal text-[var(--tg-theme-hint-color,#999999)] ml-1">
              /{billingCycle === 'monthly' ? 'month' : 'year'}
            </span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3 mb-6">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedProvider(method.id)}
              className={`w-full p-4 rounded-[12px] border-2 transition-all ${
                selectedProvider === method.id
                  ? 'border-[#3390ec] bg-[#3390ec]/10'
                  : 'border-[var(--tg-theme-secondary-bg-color,#f0f0f0)] bg-[var(--tg-theme-bg-color,#ffffff)]'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">{method.icon}</div>
                <div className="flex-1 text-left">
                  <div className="text-[17px] font-medium text-[var(--tg-theme-text-color,#000000)]">
                    {method.name}
                  </div>
                  <div className="text-[15px] text-[var(--tg-theme-hint-color,#999999)]">
                    {method.description}
                  </div>
                </div>
                {selectedProvider === method.id && (
                  <div className="w-6 h-6 rounded-full bg-[#3390ec] flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Pay Button */}
        <TelegramButton
          onClick={handlePayment}
          disabled={!selectedProvider || isProcessing}
          fullWidth
        >
          {isProcessing ? 'Processing...' : `Pay ${currency} ${price.toLocaleString()}`}
        </TelegramButton>
      </div>
    </div>
  )
}

