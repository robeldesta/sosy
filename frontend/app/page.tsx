'use client'

import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramListItem } from '@/components/telegram/TelegramListItem'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { usePermissions } from '@/hooks/usePermissions'

export default function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useTelegramWebApp()
  const { canAccessReports, canReconcileCash, canManageStaff } = usePermissions()

  return (
    <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] pb-[80px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#212121] border-b border-[#e5e5e5] dark:border-[#3a3a3a]">
        <div className="px-[14px] py-[12px]">
          <h1 className="text-[20px] font-semibold leading-[24px]" suppressHydrationWarning>
            {t('dashboard.title')}
          </h1>
          {user?.first_name && (
            <div className="text-[14px] text-[#707579] mt-[2px]">
              {user.first_name}
            </div>
          )}
        </div>
      </div>

      {/* Menu */}
      <div className="px-[14px] pt-[8px] space-y-[8px]">
        <Link href="/dashboard">
          <TelegramCard>
            <TelegramListItem
              title={t('dashboard.title')}
              subtitle="View today's sales, purchases, and activity"
              rightElement={<span className="text-[#707579] text-[15px]">›</span>}
            />
          </TelegramCard>
        </Link>

        <Link href="/stock">
          <TelegramCard>
            <TelegramListItem
              title={t('dashboard.stock')}
              subtitle={t('dashboard.stockDesc')}
              rightElement={<span className="text-[#707579] text-[15px]">›</span>}
            />
          </TelegramCard>
        </Link>

        <Link href="/invoice">
          <TelegramCard>
            <TelegramListItem
              title={t('dashboard.invoice')}
              subtitle={t('dashboard.invoiceDesc')}
              rightElement={<span className="text-[#707579] text-[15px]">›</span>}
            />
          </TelegramCard>
        </Link>

        <Link href="/purchase">
          <TelegramCard>
            <TelegramListItem
              title={t('purchase.title')}
              subtitle="Manage purchases and suppliers"
              rightElement={<span className="text-[#707579] text-[15px]">›</span>}
            />
          </TelegramCard>
        </Link>

        {canAccessReports && (
          <>
            <Link href="/cashbook">
              <TelegramCard>
                <TelegramListItem
                  title={t('cashbook.title')}
                  subtitle="Daily cash in/out summary"
                  rightElement={<span className="text-[#707579] text-[15px]">›</span>}
                />
              </TelegramCard>
            </Link>

            <Link href="/expense">
              <TelegramCard>
                <TelegramListItem
                  title={t('expense.title')}
                  subtitle="Track expenses"
                  rightElement={<span className="text-[#707579] text-[15px]">›</span>}
                />
              </TelegramCard>
            </Link>

            <Link href="/credit">
              <TelegramCard>
                <TelegramListItem
                  title={t('credit.title')}
                  subtitle="Customer credit tracking"
                  rightElement={<span className="text-[#707579] text-[15px]">›</span>}
                />
              </TelegramCard>
            </Link>

            <Link href="/reports">
              <TelegramCard>
                <TelegramListItem
                  title={t('reports.title')}
                  subtitle="Financial reports"
                  rightElement={<span className="text-[#707579] text-[15px]">›</span>}
                />
              </TelegramCard>
            </Link>
          </>
        )}

        <Link href="/staff">
          <TelegramCard>
            <TelegramListItem
              title={t('staff.title')}
              subtitle="Manage team members"
              rightElement={<span className="text-[#707579] text-[15px]">›</span>}
            />
          </TelegramCard>
        </Link>

        <Link href="/settings">
          <TelegramCard>
            <TelegramListItem
              title={t('dashboard.settings')}
              subtitle={t('dashboard.settingsDesc')}
              rightElement={<span className="text-[#707579] text-[15px]">›</span>}
            />
          </TelegramCard>
        </Link>
      </div>
    </div>
  )
}
