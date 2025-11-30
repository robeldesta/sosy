'use client'

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Product } from '@/lib/api/product'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramInput } from '@/components/telegram/TelegramInput'

interface ProductSearchProps {
  products: Product[]
  onSelect: (product: Product) => void
  onClose: () => void
}

export function ProductSearch({ products, onSelect, onClose }: ProductSearchProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products.slice(0, 10)
    const query = searchQuery.toLowerCase()
    return products.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.sku?.toLowerCase().includes(query) ||
      p.category?.toLowerCase().includes(query)
    ).slice(0, 10)
  }, [products, searchQuery])

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
      <div className="w-full bg-[#f2f3f5] dark:bg-[#181818] rounded-t-[20px] max-h-[80vh] overflow-hidden flex flex-col">
        <div className="bg-white dark:bg-[#212121] px-[14px] py-[12px] border-b border-[#e5e5e5] dark:border-[#3a3a3a]">
          <div className="flex items-center justify-between mb-[12px]">
            <h2 className="text-[20px] font-semibold" suppressHydrationWarning>
              {t('invoice.searchProducts')}
            </h2>
            <button
              onClick={onClose}
              className="text-[#3390ec] text-[17px] font-medium"
              suppressHydrationWarning
            >
              {t('common.cancel')}
            </button>
          </div>
          <TelegramInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('invoice.searchProducts')}
          />
        </div>
        <div className="flex-1 overflow-y-auto px-[14px] py-[8px]">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-[40px] text-[#707579] text-[15px]" suppressHydrationWarning>
              {t('invoice.noProductsFound')}
            </div>
          ) : (
            <div className="space-y-[4px]">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => {
                    onSelect(product)
                    onClose()
                  }}
                  className="w-full text-left bg-white dark:bg-[#212121] rounded-[12px] p-[14px] active:opacity-70"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="text-[15px] font-medium" suppressHydrationWarning>
                        {product.name}
                      </div>
                      <div className="text-[13px] text-[#707579]" suppressHydrationWarning>
                        {product.selling_price.toLocaleString()} ETB
                        {product.sku && ` • ${product.sku}`}
                      </div>
                    </div>
                    <span className="text-[#3390ec] text-[14px]">+</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

