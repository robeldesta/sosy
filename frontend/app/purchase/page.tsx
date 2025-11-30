'use client'

import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { purchaseApi, Purchase } from '@/lib/api/purchase'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramListItem } from '@/components/telegram/TelegramListItem'
import { TelegramButton } from '@/components/telegram/TelegramButton'
import { BackButton } from '@/components/telegram/BackButton'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useBackButton } from '@/hooks/useBackButton'
import Link from 'next/link'

export default function PurchasePage() {
  const { t } = useTranslation()
  const { user } = useTelegramWebApp()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)

  useBackButton()

  useEffect(() => {
    loadPurchases()
  }, [])

  const loadPurchases = async () => {
    try {
      const data = await purchaseApi.getPurchases()
      setPurchases(data)
    } catch (error) {
      console.error('Failed to load purchases:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ETB`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-[#34c759] text-white'
      case 'draft':
        return 'bg-[#707579] text-white'
      default:
        return 'bg-[#ff9500] text-white'
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
              {t('purchase.title')}
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
      <div className="px-[14px] pt-[8px]">
        {/* Create Button */}
        <Link href="/purchase/new" className="block mb-[12px]">
          <TelegramButton variant="primary" fullWidth>
            {t('purchase.create')}
          </TelegramButton>
        </Link>

        {/* Purchase List */}
        {loading ? (
          <div className="flex justify-center items-center py-[40px]">
            <div className="text-[#707579] text-[15px]">{t('common.loading')}</div>
          </div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-[60px] px-[20px]">
            <div className="text-[#707579] text-[15px] mb-[16px]">
              {t('purchase.noPurchases')}
            </div>
            <Link href="/purchase/new">
              <TelegramButton variant="primary">
                {t('purchase.createFirst')}
              </TelegramButton>
            </Link>
          </div>
        ) : (
          <div className="space-y-[8px]">
            {purchases.map((purchase) => (
              <TelegramCard key={purchase.id}>
                <TelegramListItem
                  title={purchase.purchase_number}
                  subtitle={`${purchase.supplier?.name || 'N/A'} • ${formatDate(purchase.date)}`}
                  rightElement={
                    <div className="flex flex-col items-end gap-[4px]">
                      <span className="text-[17px] font-medium text-[#000] dark:text-[#fff]">
                        {formatCurrency(purchase.total)}
                      </span>
                      <div className="flex items-center gap-[8px]">
                        <span className={`text-[12px] px-[6px] py-[2px] rounded-full font-medium ${getStatusColor(purchase.status)}`}>
                          {purchase.status}
                        </span>
                        <Link href={`/purchase/${purchase.id}`}>
                          <button className="text-[#3390ec] text-[14px] font-medium px-[8px] py-[2px] active:opacity-70">
                            {t('purchase.view')}
                          </button>
                        </Link>
                      </div>
                    </div>
                  }
                />
              </TelegramCard>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


