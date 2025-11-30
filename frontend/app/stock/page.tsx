'use client'

import { useTranslation } from 'react-i18next'
import { useEffect, useState, useRef } from 'react'
import { StockList } from '@/components/stock/StockList'
import { MovementForm } from '@/components/stock/MovementForm'
import { TelegramButton } from '@/components/telegram/TelegramButton'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { BackButton } from '@/components/telegram/BackButton'
import { useProductStore } from '@/stores/productStore'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useBackButton } from '@/hooks/useBackButton'
import Link from 'next/link'

export default function StockPage() {
  const { t } = useTranslation()
  const { products, stockItems, loading, fetchProducts, fetchStock } = useProductStore()
  const { user } = useTelegramWebApp()
  const [showMovementForm, setShowMovementForm] = useState(false)
  const addProductLinkRef = useRef<HTMLAnchorElement>(null)

  useBackButton()

  useEffect(() => {
    fetchProducts()
    fetchStock()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRecordMovementClick = () => {
    // Blur any focused elements to remove active states
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    // Also blur the Add Product link specifically
    if (addProductLinkRef.current) {
      addProductLinkRef.current.blur()
    }
    setShowMovementForm(!showMovementForm)
  }

  return (
    <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] pb-[80px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#212121] border-b border-[#e5e5e5] dark:border-[#3a3a3a]">
        <div className="flex items-center px-[14px] py-[12px]">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-[20px] font-semibold leading-[24px]">
              {t('stock.title')}
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
        {/* Action Buttons */}
        <div className="flex gap-[8px] mb-[12px]">
          <Link href="/stock/add" className="flex-1" ref={addProductLinkRef}>
            <TelegramButton variant="primary" fullWidth>
              {t('stock.addProduct')}
            </TelegramButton>
          </Link>
          <TelegramButton
            variant="secondary"
            onClick={handleRecordMovementClick}
          >
            {t('stock.recordMovement')}
          </TelegramButton>
        </div>

        {/* Movement Form */}
        {showMovementForm && (
          <TelegramCard className="mb-[12px]">
            <div className="text-[17px] font-medium mb-[12px]">
              {t('stock.recordMovement')}
            </div>
            <MovementForm onSuccess={() => setShowMovementForm(false)} />
          </TelegramCard>
        )}

        {/* Stock List */}
        <StockList 
          stockItems={stockItems} 
          products={products}
          loading={loading}
        />
      </div>
    </div>
  )
}
