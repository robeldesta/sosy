'use client'

import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { purchaseApi, Purchase } from '@/lib/api/purchase'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramListItem } from '@/components/telegram/TelegramListItem'
import { TelegramButton } from '@/components/telegram/TelegramButton'
import { BackButton } from '@/components/telegram/BackButton'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useBackButton } from '@/hooks/useBackButton'
import { useToastStore } from '@/stores/toastStore'

export default function PurchaseDetailPage() {
  const { t } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const { user, webApp } = useTelegramWebApp()
  const { addToast } = useToastStore()
  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [loading, setLoading] = useState(true)
  const [markingReceived, setMarkingReceived] = useState(false)

  useBackButton()

  useEffect(() => {
    if (params.id) {
      loadPurchase(Number(params.id))
    }
  }, [params.id])

  const loadPurchase = async (id: number) => {
    try {
      const data = await purchaseApi.getPurchase(id)
      setPurchase(data)
    } catch (error) {
      console.error('Failed to load purchase:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsReceived = async () => {
    if (!purchase || markingReceived) return

    setMarkingReceived(true)
    try {
      await purchaseApi.markAsReceived(purchase.id)
      webApp?.HapticFeedback?.notificationOccurred('success')
      addToast(t('purchase.markedAsReceived'), 'success')
      await loadPurchase(purchase.id)
    } catch (error: any) {
      webApp?.HapticFeedback?.notificationOccurred('error')
      addToast(
        error.response?.data?.detail || t('purchase.markReceivedError'),
        'error'
      )
    } finally {
      setMarkingReceived(false)
    }
  }

  const handleDownloadPDF = () => {
    if (!purchase) return
    const pdfUrl = purchaseApi.getPdfUrl(purchase.id)
    window.open(pdfUrl, '_blank')
    webApp?.HapticFeedback?.impactOccurred('light')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ETB`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] flex items-center justify-center">
        <div className="text-[#707579] text-[15px]">{t('common.loading')}</div>
      </div>
    )
  }

  if (!purchase) {
    return (
      <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] flex items-center justify-center px-[20px]">
        <div className="text-center">
          <div className="text-[#707579] text-[15px] mb-[16px]">
            {t('purchase.notFound')}
          </div>
          <button
            onClick={() => router.back()}
            className="rounded-full bg-[#3390ec] text-white px-[20px] py-[10px] text-[17px] font-medium"
          >
            {t('common.back')}
          </button>
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
            <h1 className="text-[20px] font-semibold leading-[24px]">
              {purchase.purchase_number}
            </h1>
            {user?.first_name && (
              <div className="text-[14px] text-[#707579] mt-[2px]">
                {user.first_name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-[14px] pt-[8px] space-y-[8px]">
        {/* Status */}
        <TelegramCard>
          <div className="flex justify-between items-center">
            <div className="text-[15px] text-[#707579]">{t('purchase.status')}</div>
            <span className={`text-[14px] px-[8px] py-[4px] rounded-full font-medium ${
              purchase.status === 'received'
                ? 'bg-[#34c759] text-white'
                : 'bg-[#707579] text-white'
            }`}>
              {purchase.status}
            </span>
          </div>
        </TelegramCard>

        {/* Supplier Info */}
        <TelegramCard>
          <div className="text-[17px] font-medium mb-[12px]">{t('purchase.supplier')}</div>
          <TelegramListItem
            title={purchase.supplier?.name || 'N/A'}
            subtitle={purchase.supplier?.phone || purchase.supplier?.address || ''}
          />
        </TelegramCard>

        {/* Items */}
        {purchase.items && purchase.items.length > 0 && (
          <TelegramCard>
            <div className="text-[17px] font-medium mb-[12px]">{t('purchase.items')}</div>
            <div className="space-y-[12px]">
              {purchase.items.map((item, index) => (
                <div key={item.id || index} className="border-b border-[#e5e5e5] dark:border-[#3a3a3a] pb-[12px] last:border-0">
                  <div className="flex justify-between items-start mb-[4px]">
                    <div className="text-[15px] font-medium">
                      {item.product?.name || `Product ID: ${item.product_id}`}
                    </div>
                    <div className="text-[15px] font-medium">
                      {formatCurrency(item.total)}
                    </div>
                  </div>
                  <div className="text-[14px] text-[#707579]">
                    {item.quantity} × {formatCurrency(item.unit_cost)}
                  </div>
                </div>
              ))}
            </div>
          </TelegramCard>
        )}

        {/* Totals */}
        <TelegramCard>
          <div className="space-y-[8px]">
            <div className="flex justify-between items-center">
              <div className="text-[15px] text-[#707579]">{t('purchase.subtotal')}</div>
              <div className="text-[15px]">{formatCurrency(purchase.subtotal)}</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-[15px] text-[#707579]">{t('purchase.tax')}</div>
              <div className="text-[15px]">{formatCurrency(purchase.tax)}</div>
            </div>
            <div className="border-t border-[#e5e5e5] dark:border-[#3a3a3a] pt-[8px] mt-[8px]">
              <div className="flex justify-between items-center">
                <div className="text-[17px] font-semibold">{t('purchase.total')}</div>
                <div className="text-[20px] font-bold">{formatCurrency(purchase.total)}</div>
              </div>
            </div>
          </div>
        </TelegramCard>

        {/* Notes */}
        {purchase.notes && (
          <TelegramCard>
            <div className="text-[17px] font-medium mb-[8px]">{t('purchase.notes')}</div>
            <div className="text-[15px] text-[#707579]">{purchase.notes}</div>
          </TelegramCard>
        )}

        {/* Date */}
        <TelegramCard>
          <div className="text-[14px] text-[#707579]">
            {t('invoice.createdAt')}: {formatDate(purchase.created_at)}
          </div>
        </TelegramCard>

        {/* Actions */}
        <div className="space-y-[8px] pt-[8px]">
          <TelegramButton
            variant="primary"
            fullWidth
            onClick={handleDownloadPDF}
          >
            {t('purchase.downloadPDF')}
          </TelegramButton>

          {purchase.status !== 'received' && (
            <TelegramButton
              variant="secondary"
              fullWidth
              onClick={handleMarkAsReceived}
              disabled={markingReceived}
            >
              {markingReceived ? t('common.saving') : t('purchase.markAsReceived')}
            </TelegramButton>
          )}
        </div>
      </div>
    </div>
  )
}


