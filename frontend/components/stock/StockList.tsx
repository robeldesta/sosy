'use client'

import { useTranslation } from 'react-i18next'
import { StockItem } from '@/lib/api/inventory'
import { Product } from '@/lib/api/product'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramListItem } from '@/components/telegram/TelegramListItem'
import Link from 'next/link'

interface StockListProps {
  stockItems: StockItem[]
  products: Product[]
  loading?: boolean
}

export function StockList({ stockItems, products, loading }: StockListProps) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="flex justify-center items-center py-[40px]">
        <div className="text-[#707579] text-[15px]">{t('common.loading')}</div>
      </div>
    )
  }

  if (stockItems.length === 0) {
    return (
      <div className="text-center py-[60px] px-[20px]">
        <div className="text-[#707579] text-[15px] mb-[16px]">
          {t('stock.noItems')}
        </div>
        <Link href="/stock/add">
          <button className="rounded-full bg-[#3390ec] text-white px-[20px] py-[10px] text-[17px] font-medium">
            {t('stock.addFirstProduct')}
          </button>
        </Link>
      </div>
    )
  }

  const productMap = new Map(products.map(p => [p.id, p]))

  return (
    <div className="space-y-[8px]">
      {stockItems.map((item) => {
        const product = productMap.get(item.product_id)
        const isLowStock = product && product.low_stock_threshold 
          ? item.quantity <= product.low_stock_threshold 
          : false

        return (
          <TelegramCard key={item.id}>
            <TelegramListItem
              title={item.product_name}
              subtitle={`${item.quantity.toLocaleString()} ${item.unit_of_measure} • ${item.location}`}
              rightElement={
                <div className="flex items-center gap-[8px]">
                  {isLowStock && (
                    <span className="w-[8px] h-[8px] rounded-full bg-[#ff3b30]" />
                  )}
                  <span className="text-[#707579] text-[15px]">›</span>
                </div>
              }
            />
          </TelegramCard>
        )
      })}
    </div>
  )
}

