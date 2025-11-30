'use client'

import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { businessApi, Business, UpdateBusiness } from '@/lib/api/business'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramInput } from '@/components/telegram/TelegramInput'
import { BackButton } from '@/components/telegram/BackButton'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useBackButton } from '@/hooks/useBackButton'
import { useMainButton } from '@/hooks/useMainButton'
import { useToastStore } from '@/stores/toastStore'

export default function ShopSettingsPage() {
  const { t } = useTranslation()
  const { webApp } = useTelegramWebApp()
  const { addToast } = useToastStore()
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<UpdateBusiness>({
    name: '',
    business_type: '',
    location: '',
    currency: 'ETB',
    tax_type: '',
    address: '',
    phone: '',
    email: '',
  })

  useBackButton()

  useEffect(() => {
    loadBusiness()
  }, [])

  const loadBusiness = async () => {
    try {
      const data = await businessApi.getBusiness()
      setBusiness(data)
      setFormData({
        name: data.name || '',
        business_type: data.business_type || '',
        location: data.location || '',
        currency: data.currency || 'ETB',
        tax_type: data.tax_type || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
      })
    } catch (error) {
      console.error('Failed to load business:', error)
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = formData.name?.trim() !== ''

  const handleSave = async () => {
    if (!isFormValid || saving) return

    setSaving(true)
    try {
      const updated = await businessApi.updateBusiness(formData)
      setBusiness(updated)
      webApp?.HapticFeedback?.notificationOccurred('success')
      addToast(t('settings.shopUpdated'), 'success')
    } catch (error: any) {
      webApp?.HapticFeedback?.notificationOccurred('error')
      addToast(
        error.response?.data?.detail || t('settings.updateError'),
        'error'
      )
    } finally {
      setSaving(false)
    }
  }

  useMainButton({
    text: t('common.save'),
    isActive: isFormValid && !saving,
    isVisible: true,
    onClick: handleSave,
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] flex items-center justify-center">
        <div className="text-[#707579] text-[15px]" suppressHydrationWarning>{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] pb-[80px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#212121] border-b border-[#e5e5e5] dark:border-[#3a3a3a]">
        <div className="flex items-center px-[14px] py-[12px]">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-[20px] font-semibold leading-[24px]" suppressHydrationWarning>
              {t('settings.shop')}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-[14px] pt-[8px] space-y-[8px]">
        <TelegramCard>
          <TelegramInput
            label={t('settings.businessName')}
            value={formData.name || ''}
            onChange={(value) => setFormData({ ...formData, name: value })}
            placeholder={t('settings.businessName')}
            required
          />
          <TelegramInput
            label={t('settings.businessType')}
            value={formData.business_type || ''}
            onChange={(value) => setFormData({ ...formData, business_type: value })}
            placeholder={t('settings.businessType')}
          />
          <TelegramInput
            label={t('settings.location')}
            value={formData.location || ''}
            onChange={(value) => setFormData({ ...formData, location: value })}
            placeholder={t('settings.location')}
          />
          <TelegramInput
            label={t('settings.currency')}
            value={formData.currency || 'ETB'}
            onChange={(value) => setFormData({ ...formData, currency: value })}
            placeholder="ETB"
          />
          <TelegramInput
            label={t('settings.taxType')}
            value={formData.tax_type || ''}
            onChange={(value) => setFormData({ ...formData, tax_type: value })}
            placeholder={t('settings.taxType')}
          />
          <TelegramInput
            label={t('settings.address')}
            value={formData.address || ''}
            onChange={(value) => setFormData({ ...formData, address: value })}
            placeholder={t('settings.address')}
          />
          <TelegramInput
            label={t('settings.phone')}
            type="tel"
            value={formData.phone || ''}
            onChange={(value) => setFormData({ ...formData, phone: value })}
            placeholder="+251..."
          />
          <TelegramInput
            label={t('settings.email')}
            type="email"
            value={formData.email || ''}
            onChange={(value) => setFormData({ ...formData, email: value })}
            placeholder="email@example.com"
          />
        </TelegramCard>
      </div>
    </div>
  )
}

