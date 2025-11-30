'use client'

import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramListItem } from '@/components/telegram/TelegramListItem'
import { BackButton } from '@/components/telegram/BackButton'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useBackButton } from '@/hooks/useBackButton'
import { usePermissions } from '@/hooks/usePermissions'

export default function SettingsPage() {
  const { t } = useTranslation()
  const { user } = useTelegramWebApp()
  const { canAccessSettings, canManageStaff, canAccessReports } = usePermissions()

  useBackButton()

  return (
    <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] pb-[80px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#212121] border-b border-[#e5e5e5] dark:border-[#3a3a3a]">
        <div className="flex items-center px-[14px] py-[12px]">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-[20px] font-semibold leading-[24px]" suppressHydrationWarning>
              {t('settings.title')}
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
        <Link href="/profile">
          <TelegramCard>
            <TelegramListItem
              title={t('settings.profile')}
              subtitle={t('settings.profileDesc')}
              rightElement={<span className="text-[#707579] text-[15px]">›</span>}
            />
          </TelegramCard>
        </Link>

        <Link href="/settings/shop">
          <TelegramCard>
            <TelegramListItem
              title={t('settings.shop')}
              subtitle={t('settings.shopDesc')}
              rightElement={<span className="text-[#707579] text-[15px]">›</span>}
            />
          </TelegramCard>
        </Link>

        {canAccessReports && (
          <Link href="/analytics">
            <TelegramCard>
              <TelegramListItem
                title={t('settings.analytics')}
                subtitle={t('settings.analyticsDesc')}
                rightElement={<span className="text-[#707579] text-[15px]">›</span>}
              />
            </TelegramCard>
          </Link>
        )}

        {canManageStaff && (
          <Link href="/staff">
            <TelegramCard>
              <TelegramListItem
                title={t('staff.title')}
                subtitle="Manage team and permissions"
                rightElement={<span className="text-[#707579] text-[15px]">›</span>}
              />
            </TelegramCard>
          </Link>
        )}

        {canAccessReports && (
          <Link href="/reports">
            <TelegramCard>
              <TelegramListItem
                title={t('reports.title')}
                subtitle="Financial reports and insights"
                rightElement={<span className="text-[#707579] text-[15px]">›</span>}
              />
            </TelegramCard>
          </Link>
        )}
      </div>
    </div>
  )
}
