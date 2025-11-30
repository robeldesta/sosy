'use client'

import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { profileApi, UserProfile, UpdateProfile } from '@/lib/api/profile'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramInput } from '@/components/telegram/TelegramInput'
import { TelegramButton } from '@/components/telegram/TelegramButton'
import { BackButton } from '@/components/telegram/BackButton'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useBackButton } from '@/hooks/useBackButton'
import { useMainButton } from '@/hooks/useMainButton'
import { useToastStore } from '@/stores/toastStore'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const { user, webApp } = useTelegramWebApp()
  const { addToast } = useToastStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<UpdateProfile>({
    first_name: '',
    last_name: '',
    phone: '',
    language: 'en',
  })

  useBackButton()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const data = await profileApi.getProfile()
      setProfile(data)
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone: data.phone || '',
        language: data.language || 'en',
      })
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = formData.first_name?.trim() !== ''

  const handleSave = async () => {
    if (!isFormValid || saving) return

    setSaving(true)
    try {
      const updated = await profileApi.updateProfile(formData)
      setProfile(updated)
      webApp?.HapticFeedback?.notificationOccurred('success')
      addToast(t('profile.updated'), 'success')
      
      // Update language if changed
      if (formData.language && formData.language !== i18n.language) {
        await i18n.changeLanguage(formData.language)
      }
    } catch (error: any) {
      webApp?.HapticFeedback?.notificationOccurred('error')
      addToast(
        error.response?.data?.detail || t('profile.updateError'),
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

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'am', name: 'አማርኛ (Amharic)' },
    { code: 'om', name: 'Afaan Oromoo' },
    { code: 'ti', name: 'ትግርኛ (Tigrigna)' },
  ]

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
              {t('profile.title')}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-[14px] pt-[8px] space-y-[8px]">
        <TelegramCard>
          <TelegramInput
            label={t('profile.firstName')}
            value={formData.first_name || ''}
            onChange={(value) => setFormData({ ...formData, first_name: value })}
            placeholder={t('profile.firstName')}
            required
          />
          <TelegramInput
            label={t('profile.lastName')}
            value={formData.last_name || ''}
            onChange={(value) => setFormData({ ...formData, last_name: value })}
            placeholder={t('profile.lastName')}
          />
          <TelegramInput
            label={t('profile.phone')}
            type="tel"
            value={formData.phone || ''}
            onChange={(value) => setFormData({ ...formData, phone: value })}
            placeholder="+251..."
          />
          
          <div className="mt-[12px]">
            <label className="block text-[14px] text-[#707579] mb-[6px]" suppressHydrationWarning>
              {t('profile.language')}
            </label>
            <select
              value={formData.language || 'en'}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="w-full px-[14px] py-[10px] text-[17px] bg-transparent border-b border-[#e5e5e5] dark:border-[#3a3a3a] focus:outline-none focus:border-[#3390ec]"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </TelegramCard>

        <TelegramCard>
          <div className="text-[14px] text-[#707579]" suppressHydrationWarning>
            {t('profile.telegramId')}: {profile?.telegram_id}
          </div>
        </TelegramCard>
      </div>
    </div>
  )
}

