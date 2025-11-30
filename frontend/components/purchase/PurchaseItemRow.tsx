'use client'

import { useTranslation } from 'react-i18next'
import { PurchaseDraftItem } from '@/stores/purchaseStore'
import { Product } from '@/lib/api/product'

interface PurchaseItemRowProps {
  item: PurchaseDraftItem
  products: Product[]
  index: number
  onUpdate: (index: number, updates: Partial<PurchaseDraftItem>) => void
  onRemove: (index: number) => void
}

export function PurchaseItemRow({ item, products, index, onUpdate, onRemove }: PurchaseItemRowProps) {
  const { t } = useTranslation()

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = parseInt(e.target.value)
    const product = products.find(p => p.id === productId)
    onUpdate(index, {
      product_id: productId,
      product_name: product?.name,
      unit_cost: product?.buying_price || 0,
    })
  }

  return (
    <div className="border-b border-[#e5e5e5] dark:border-[#3a3a3a] pb-[12px] mb-[12px] last:border-0 last:mb-0">
      <div className="flex items-center justify-between mb-[8px]">
        <div className="text-[14px] text-[#707579]">{t('purchase.item')} #{index + 1}</div>
        <button
          onClick={() => onRemove(index)}
          className="text-[#ff3b30] text-[14px] font-medium active:opacity-70"
        >
          {t('common.delete')}
        </button>
      </div>

      <div className="space-y-[8px]">
        <div>
          <label className="block text-[14px] text-[#707579] mb-[6px]">
            {t('purchase.product')} *
          </label>
          <select
            value={item.product_id}
            onChange={handleProductChange}
            className="w-full px-[14px] py-[10px] text-[17px] bg-transparent border-b border-[#e5e5e5] dark:border-[#3a3a3a] focus:outline-none focus:border-[#3390ec]"
          >
            <option value={0}>{t('purchase.selectProduct')}</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} {product.sku && `(${product.sku})`}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-[8px]">
          <div>
            <label className="block text-[14px] text-[#707579] mb-[6px]">
              {t('purchase.quantity')} *
            </label>
            <input
              type="number"
              value={item.quantity || ''}
              onChange={(e) => onUpdate(index, { quantity: parseFloat(e.target.value) || 0 })}
              className="w-full px-[14px] py-[10px] text-[17px] bg-transparent border-b border-[#e5e5e5] dark:border-[#3a3a3a] focus:outline-none focus:border-[#3390ec]"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-[14px] text-[#707579] mb-[6px]">
              {t('purchase.unitCost')} *
            </label>
            <input
              type="number"
              value={item.unit_cost || ''}
              onChange={(e) => onUpdate(index, { unit_cost: parseFloat(e.target.value) || 0 })}
              className="w-full px-[14px] py-[10px] text-[17px] bg-transparent border-b border-[#e5e5e5] dark:border-[#3a3a3a] focus:outline-none focus:border-[#3390ec]"
              placeholder="0"
            />
          </div>
        </div>

        <div className="text-right">
          <div className="text-[14px] text-[#707579]">{t('purchase.total')}</div>
          <div className="text-[17px] font-semibold">{item.total.toLocaleString()} ETB</div>
        </div>
      </div>
    </div>
  )
}


