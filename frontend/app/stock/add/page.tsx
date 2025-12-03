'use client'

import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AddProductForm } from '@/components/stock/AddProductForm'
import { BackButton } from '@/components/telegram/BackButton'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useBackButton } from '@/hooks/useBackButton'
import { useMainButton } from '@/hooks/useMainButton'

export default function AddProductPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, webApp } = useTelegramWebApp()
  const [isFormValid, setIsFormValid] = useState(false)

  useBackButton()

  useMainButton({
    text: t('stock.createProduct'),
    isActive: isFormValid,
    isVisible: !!webApp, // Only show MainButton in Telegram
    onClick: () => {
      // Form submission handled by AddProductForm
      const form = document.querySelector('form') as HTMLFormElement
      if (form) {
        form.requestSubmit()
      }
    },
  })

  return (
    <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] pb-[80px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#212121] border-b border-[#e5e5e5] dark:border-[#3a3a3a]">
        <div className="flex items-center px-[14px] py-[12px]">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-[20px] font-semibold leading-[24px]">
              {t('stock.addProduct')}
            </h1>
            {user?.first_name && (
              <div className="text-[14px] text-[#707579] mt-[2px]">
                {user.first_name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-[14px] pt-[8px]">
        <div className="bg-white dark:bg-[#212121] rounded-[12px] p-[14px]">
          <AddProductForm onFormValidChange={setIsFormValid} />
        </div>
      </div>
    </div>
  )
}
