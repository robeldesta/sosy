'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { adminApi, SystemStats } from '@/lib/api/admin'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { SkeletonCard } from '@/components/telegram/SkeletonCard'

export default function AdminDashboardPage() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await adminApi.getStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load admin stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] p-[14px]">
        <div className="max-w-4xl mx-auto space-y-[12px]">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] flex items-center justify-center p-[14px]">
        <div className="text-[#707579] text-[15px]">{t('common.error')}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] pb-[80px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#212121] border-b border-[#e5e5e5] dark:border-[#3a3a3a]">
        <div className="px-[14px] py-[12px]">
          <h1 className="text-[20px] font-semibold leading-[24px]">
            Admin Dashboard
          </h1>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-[14px] space-y-[12px]">
        <div className="grid grid-cols-2 gap-[12px]">
          <TelegramCard>
            <div className="p-[14px]">
              <div className="text-[13px] text-[#707579] mb-[4px]">Total Businesses</div>
              <div className="text-[24px] font-semibold">{stats.total_businesses}</div>
            </div>
          </TelegramCard>

          <TelegramCard>
            <div className="p-[14px]">
              <div className="text-[13px] text-[#707579] mb-[4px]">Active Users Today</div>
              <div className="text-[24px] font-semibold">{stats.active_users_today}</div>
            </div>
          </TelegramCard>

          <TelegramCard>
            <div className="p-[14px]">
              <div className="text-[13px] text-[#707579] mb-[4px]">Invoices (24h)</div>
              <div className="text-[24px] font-semibold">{stats.invoices_24h}</div>
            </div>
          </TelegramCard>

          <TelegramCard>
            <div className="p-[14px]">
              <div className="text-[13px] text-[#707579] mb-[4px]">Sync Errors (24h)</div>
              <div className="text-[24px] font-semibold text-[#ff3b30]">{stats.sync_errors_24h}</div>
            </div>
          </TelegramCard>
        </div>

        {/* Revenue */}
        <TelegramCard>
          <div className="p-[14px]">
            <div className="text-[13px] text-[#707579] mb-[8px]">Revenue</div>
            <div className="space-y-[8px]">
              <div className="flex justify-between items-center">
                <span className="text-[15px]">Monthly Recurring Revenue (MRR)</span>
                <span className="text-[18px] font-semibold">{stats.mrr.toFixed(2)} ETB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[15px]">Annual Recurring Revenue (ARR)</span>
                <span className="text-[18px] font-semibold">{stats.arr.toFixed(2)} ETB</span>
              </div>
            </div>
          </div>
        </TelegramCard>
      </div>
    </div>
  )
}

