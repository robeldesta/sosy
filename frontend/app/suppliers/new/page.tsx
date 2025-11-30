'use client'

import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supplierApi } from '@/lib/api/supplier'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramInput } from '@/components/telegram/TelegramInput'
import { BackButton } from '@/components/telegram/BackButton'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useBackButton } from '@/hooks/useBackButton'
import { useMainButton } from '@/hooks/useMainButton'
import { useToastStore } from '@/stores/toastStore'
import { useSupplierStore } from '@/stores/supplierStore'

export default function NewSupplierPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, webApp } = useTelegramWebApp()
  const { addToast } = useToastStore()
  const { addSupplier } = useSupplierStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  })

  useBackButton()

  const isFormValid = formData.name.trim() !== ''

  useMainButton({
    text: t('supplier.create'),
    isActive: isFormValid && !loading,
    isVisible: true,
    onClick: handleSubmit,
  })

  async function handleSubmit() {
    if (!isFormValid || loading) return

    setLoading(true)
    try {
      const supplier = await supplierApi.createSupplier(formData)
      webApp?.HapticFeedback?.notificationOccurred('success')
      addToast(t('supplier.created'), 'success')
      addSupplier(supplier)
      router.push(`/suppliers/${supplier.id}`)
    } catch (error: any) {
      webApp?.HapticFeedback?.notificationOccurred('error')
      addToast(
        error.response?.data?.detail || t('supplier.createError'),
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] pb-[80px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#212121] border-b border-[#e5e5e5] dark:border-[#3a3a3a]">
        <div className="flex items-center px-[14px] py-[12px]">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-[20px] font-semibold leading-[24px]">
              {t('supplier.createNew')}
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
        <TelegramCard>
          <TelegramInput
            label={t('supplier.name')}
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
            placeholder={t('supplier.name')}
            required
          />
          <TelegramInput
            label={t('supplier.phone')}
            value={formData.phone}
            onChange={(value) => setFormData({ ...formData, phone: value })}
            placeholder={t('supplier.phone')}
            type="tel"
          />
          <TelegramInput
            label={t('supplier.address')}
            value={formData.address}
            onChange={(value) => setFormData({ ...formData, address: value })}
            placeholder={t('supplier.address')}
          />
          <TelegramInput
            label={t('supplier.notes')}
            value={formData.notes}
            onChange={(value) => setFormData({ ...formData, notes: value })}
            placeholder={t('supplier.notes')}
          />
        </TelegramCard>
      </div>
    </div>
  )
}


