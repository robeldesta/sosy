'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter, useParams } from 'next/navigation'
import { adminApi, Business, BusinessMetrics } from '@/lib/api/admin'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramButton } from '@/components/telegram/TelegramButton'
import { BackButton } from '@/components/telegram/BackButton'
import { useBackButton } from '@/hooks/useBackButton'
import { useToastStore } from '@/stores/toastStore'

export default function AdminBusinessDetailPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const params = useParams()
  const businessId = parseInt(params.id as string)
  const { addToast } = useToastStore()
  
  const [business, setBusiness] = useState<Business | null>(null)
  const [metrics, setMetrics] = useState<BusinessMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [suspending, setSuspending] = useState(false)

  useBackButton()

  useEffect(() => {
    if (businessId) {
      loadBusiness()
      loadMetrics()
    }
  }, [businessId])

  const loadBusiness = async () => {
    try {
      setLoading(true)
      const data = await adminApi.getBusiness(businessId)
      setBusiness(data)
    } catch (error) {
      console.error('Failed to load business:', error)
      addToast('Failed to load business', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadMetrics = async () => {
    try {
      const data = await adminApi.getBusinessMetrics(businessId, 30)
      setMetrics(data)
    } catch (error) {
      console.error('Failed to load metrics:', error)
    }
  }

  const handleSuspend = async () => {
    if (!confirm('Are you sure you want to suspend this business?')) {
      return
    }

    try {
      setSuspending(true)
      await adminApi.suspendBusiness(businessId, 'Suspended by admin')
      addToast('Business suspended', 'success')
      loadBusiness()
    } catch (error) {
      addToast('Failed to suspend business', 'error')
    } finally {
      setSuspending(false)
    }
  }

  if (loading || !business) {
    return (
      <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] flex items-center justify-center">
        <div className="text-[#707579] text-[15px]">{t('common.loading')}</div>
      </div>
    )
  }

  const totalSales = metrics.reduce((sum, m) => sum + m.total_sales, 0)
  const totalProfit = metrics.reduce((sum, m) => sum + m.profit, 0)

  return (
    <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] pb-[80px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#212121] border-b border-[#e5e5e5] dark:border-[#3a3a3a]">
        <div className="flex items-center px-[14px] py-[12px]">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-[20px] font-semibold leading-[24px]">{business.name}</h1>
          </div>
        </div>
      </div>

      {/* Business Info */}
      <div className="p-[14px] space-y-[12px]">
        <TelegramCard>
          <div className="p-[14px] space-y-[8px]">
            <div className="flex justify-between">
              <span className="text-[#707579]">Type</span>
              <span>{business.business_type || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#707579]">Location</span>
              <span>{business.location || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#707579]">Currency</span>
              <span>{business.currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#707579]">Created</span>
              <span>{new Date(business.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </TelegramCard>

        {/* Metrics */}
        {metrics.length > 0 && (
          <TelegramCard>
            <div className="p-[14px]">
              <div className="text-[17px] font-medium mb-[12px]">30-Day Metrics</div>
              <div className="space-y-[8px]">
                <div className="flex justify-between">
                  <span className="text-[#707579]">Total Sales</span>
                  <span className="font-semibold">{totalSales.toFixed(2)} ETB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#707579]">Total Profit</span>
                  <span className="font-semibold">{totalProfit.toFixed(2)} ETB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#707579]">Total Invoices</span>
                  <span>{metrics.reduce((sum, m) => sum + m.total_invoices, 0)}</span>
                </div>
              </div>
            </div>
          </TelegramCard>
        )}

        {/* Actions */}
        <div className="space-y-[8px]">
          <TelegramButton
            onClick={handleSuspend}
            disabled={suspending}
            variant="danger"
            fullWidth
          >
            {suspending ? 'Suspending...' : 'Suspend Business'}
          </TelegramButton>
        </div>
      </div>
    </div>
  )
}

