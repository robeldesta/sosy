'use client'

import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramListItem } from '@/components/telegram/TelegramListItem'
import { TelegramButton } from '@/components/telegram/TelegramButton'
import { BackButton } from '@/components/telegram/BackButton'
import { staffApi, StaffMember } from '@/lib/api/staff'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useBackButton } from '@/hooks/useBackButton'
import { usePermissions } from '@/hooks/usePermissions'
import { useToastStore } from '@/stores/toastStore'
import { SkeletonCard } from '@/components/telegram/SkeletonLoader'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import Link from 'next/link'

export default function StaffPage() {
  const { t } = useTranslation()
  const { user, webApp } = useTelegramWebApp()
  const { canManageStaff } = usePermissions()
  const { addToast } = useToastStore()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useBackButton()

  useEffect(() => {
    if (canManageStaff) {
      loadStaff()
    }
  }, [canManageStaff])

  const loadStaff = async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await staffApi.listStaff()
      setStaff(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || t('staff.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveStaff = async (userId: number, userName: string) => {
    if (!confirm(t('staff.confirmRemove', { name: userName }))) return

    try {
      await staffApi.removeStaff(userId)
      webApp?.HapticFeedback?.notificationOccurred('success')
      addToast(t('staff.removed'), 'success')
      loadStaff()
    } catch (err: any) {
      webApp?.HapticFeedback?.notificationOccurred('error')
      addToast(err.response?.data?.detail || t('staff.removeError'), 'error')
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return t('staff.never')
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!canManageStaff) {
    return (
      <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] flex items-center justify-center px-[20px]">
        <div className="text-center">
          <div className="text-[#707579] text-[15px] mb-[16px]" suppressHydrationWarning>
            {t('staff.noPermission')}
          </div>
        </div>
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
              {t('staff.title')}
            </h1>
            {user?.first_name && (
              <div className="text-[14px] text-[#707579] mt-[2px]" suppressHydrationWarning>
                {user.first_name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-[14px] pt-[8px] space-y-[8px]">
        <Link href="/staff/invite">
          <TelegramButton variant="primary" fullWidth>
            {t('staff.addStaff')}
          </TelegramButton>
        </Link>

        {error ? (
          <ErrorState message={error} onRetry={loadStaff} />
        ) : loading ? (
          <div className="space-y-[8px]">
            {[...Array(3)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : staff.length === 0 ? (
          <EmptyState title={t('staff.noStaff')} />
        ) : (
          <div className="space-y-[8px]">
            {staff.map((member) => (
              <TelegramCard key={member.id}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-[15px] font-medium mb-[4px]" suppressHydrationWarning>
                      {member.first_name} {member.last_name || ''} {member.username ? `(@${member.username})` : ''}
                    </div>
                    <div className="text-[13px] text-[#707579]" suppressHydrationWarning>
                      {t(`staff.roles.${member.role}`)} • {t('staff.lastLogin')}: {formatDate(member.last_login_at)}
                    </div>
                  </div>
                  {member.role !== 'owner' && (
                    <button
                      onClick={() => handleRemoveStaff(member.id, member.first_name || member.username || 'Staff')}
                      className="text-[#ff3b30] text-[14px] px-[8px] py-[4px]"
                      suppressHydrationWarning
                    >
                      {t('common.delete')}
                    </button>
                  )}
                </div>
              </TelegramCard>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

