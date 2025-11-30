'use client'

import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { activityApi, ActivityLog } from '@/lib/api/activity'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { BackButton } from '@/components/telegram/BackButton'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useBackButton } from '@/hooks/useBackButton'

export default function ActivityPage() {
  const { t } = useTranslation()
  const { user } = useTelegramWebApp()
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useBackButton()

  useEffect(() => {
    loadActivity()
  }, [])

  const loadActivity = async () => {
    try {
      const data = await activityApi.getActivity(50)
      setActivities(data)
    } catch (error) {
      console.error('Failed to load activity:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'invoice_created':
      case 'quick_sell':
        return '💰'
      case 'purchase_created':
        return '🛒'
      case 'stock_low':
        return '⚠️'
      case 'invoice_paid':
        return '✅'
      case 'product_updated':
        return '📦'
      default:
        return '📝'
    }
  }

  return (
    <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] pb-[80px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#212121] border-b border-[#e5e5e5] dark:border-[#3a3a3a]">
        <div className="flex items-center px-[14px] py-[12px]">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-[20px] font-semibold leading-[24px]" suppressHydrationWarning>
              {t('activity.title')}
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
      <div className="px-[14px] pt-[8px]">
        {loading ? (
          <div className="flex justify-center items-center py-[40px]">
            <div className="text-[#707579] text-[15px]" suppressHydrationWarning>{t('common.loading')}</div>
          </div>
        ) : activities.length === 0 ? (
          <TelegramCard>
            <div className="text-center py-[40px]">
              <div className="text-[#707579] text-[15px]" suppressHydrationWarning>
                {t('activity.noActivity')}
              </div>
            </div>
          </TelegramCard>
        ) : (
          <div className="space-y-[8px]">
            {activities.map((activity) => (
              <TelegramCard key={activity.id}>
                <div className="flex items-start gap-[12px]">
                  <div className="text-[24px]">{getActionIcon(activity.action_type)}</div>
                  <div className="flex-1">
                    <div className="text-[15px]" suppressHydrationWarning>
                      {activity.description}
                    </div>
                    <div className="text-[13px] text-[#707579] mt-[4px]" suppressHydrationWarning>
                      {formatTimestamp(activity.timestamp)}
                      {activity.user_name && ` • ${activity.user_name}`}
                    </div>
                  </div>
                </div>
              </TelegramCard>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

