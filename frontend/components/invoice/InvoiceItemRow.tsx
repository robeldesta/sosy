'use client'

import { useTranslation } from 'react-i18next'
import { InvoiceItem } from '@/stores/invoiceStore'
import { Product } from '@/lib/api/product'

interface InvoiceItemRowProps {
  item: InvoiceItem
  index: number
  products: Product[]
  onUpdate: (index: number, updates: Partial<InvoiceItem>) => void
  onRemove: (index: number) => void
}

export function InvoiceItemRow({ item, index, products, onUpdate, onRemove }: InvoiceItemRowProps) {
  const { t } = useTranslation()
  const product = products.find(p => p.id === item.product_id)

  const handleProductChange = (productId: number) => {
    const selectedProduct = products.find(p => p.id === productId)
    onUpdate(index, {
      product_id: productId,
      product_name: selectedProduct?.name,
      unit_price: selectedProduct?.selling_price || 0,
    })
  }

  const handleQuantityChange = (quantity: number) => {
    onUpdate(index, { quantity })
  }

  const handlePriceChange = (unit_price: number) => {
    onUpdate(index, { unit_price })
  }

  return (
    <div className="border-b border-[#e5e5e5] dark:border-[#3a3a3a] pb-[12px] mb-[12px] last:border-0 last:mb-0">
      <div className="flex justify-between items-start mb-[8px]">
        <div className="flex-1">
          <select
            value={item.product_id}
            onChange={(e) => handleProductChange(parseInt(e.target.value))}
            className="w-full px-[10px] py-[6px] text-[15px] bg-transparent border border-[#e5e5e5] dark:border-[#3a3a3a] rounded-[8px] mb-[8px]"
          >
            <option value={0}>{t('invoice.selectProduct')}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.sku && `(${p.sku})`}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => onRemove(index)}
          className="text-[#ff3b30] text-[14px] ml-[8px] px-[8px] py-[4px] active:opacity-70"
        >
          {t('common.delete')}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-[8px]">
        <div>
          <label className="block text-[12px] text-[#707579] mb-[4px]">
            {t('invoice.quantity')}
          </label>
          <input
            type="number"
            value={item.quantity || ''}
            onChange={(e) => handleQuantityChange(parseFloat(e.target.value) || 0)}
            className="w-full px-[10px] py-[6px] text-[15px] bg-transparent border border-[#e5e5e5] dark:border-[#3a3a3a] rounded-[8px]"
          />
        </div>
        <div>
          <label className="block text-[12px] text-[#707579] mb-[4px]">
            {t('invoice.price')} (ETB)
          </label>
          <input
            type="number"
            value={item.unit_price || ''}
            onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
            className="w-full px-[10px] py-[6px] text-[15px] bg-transparent border border-[#e5e5e5] dark:border-[#3a3a3a] rounded-[8px]"
          />
        </div>
      </div>

      {item.quantity > 0 && item.unit_price > 0 && (
        <div className="mt-[8px] text-right">
          <span className="text-[14px] text-[#707579]">{t('invoice.itemTotal')}: </span>
          <span className="text-[15px] font-medium">
            {item.total.toLocaleString()} ETB
          </span>
        </div>
      )}
    </div>
  )
}

