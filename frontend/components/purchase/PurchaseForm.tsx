'use client'

import { useTranslation } from 'react-i18next'
import { Supplier } from '@/lib/api/supplier'
import { Product } from '@/lib/api/product'
import { PurchaseDraftItem, usePurchaseStore } from '@/stores/purchaseStore'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramInput } from '@/components/telegram/TelegramInput'
import { TelegramButton } from '@/components/telegram/TelegramButton'
import { PurchaseItemRow } from './PurchaseItemRow'

interface PurchaseFormProps {
  suppliers: Supplier[]
  products: Product[]
  loading?: boolean
}

export function PurchaseForm({ suppliers, products, loading }: PurchaseFormProps) {
  const { t } = useTranslation()
  const {
    draft,
    setSupplier,
    setDate,
    setNotes,
    addItem,
    updateItem,
    removeItem,
    calculateSubtotal,
    calculateTax,
    calculateTotal,
  } = usePurchaseStore()

  const handleAddItem = () => {
    addItem({
      product_id: 0,
      quantity: 0,
      unit_cost: 0,
    })
  }

  return (
    <div className="space-y-[8px]">
      {/* Supplier Selection */}
      <TelegramCard>
        <label className="block text-[14px] text-[#707579] mb-[6px]">
          {t('purchase.supplier')} *
        </label>
        <select
          value={draft.supplier_id}
          onChange={(e) => {
            const supplierId = parseInt(e.target.value)
            const supplier = suppliers.find(s => s.id === supplierId)
            setSupplier(supplierId, supplier?.name)
          }}
          className="w-full px-[14px] py-[10px] text-[17px] bg-transparent border-b border-[#e5e5e5] dark:border-[#3a3a3a] focus:outline-none focus:border-[#3390ec]"
        >
          <option value={0}>{t('purchase.selectSupplier')}</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
      </TelegramCard>

      {/* Date */}
      <TelegramCard>
        <div className="mb-[16px]">
          <label className="block text-[14px] text-[#707579] dark:text-[#707579] mb-[6px]">
            {t('purchase.date')}
          </label>
          <input
            type="date"
            value={draft.date || ''}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-[14px] py-[10px] text-[17px] bg-transparent border-b border-[#e5e5e5] dark:border-[#3a3a3a] focus:outline-none focus:border-[#3390ec] transition-colors"
          />
        </div>
      </TelegramCard>

      {/* Items */}
      <TelegramCard>
        <div className="flex items-center justify-between mb-[12px]">
          <div className="text-[17px] font-medium">{t('purchase.items')}</div>
          <button
            onClick={handleAddItem}
            className="text-[#3390ec] text-[14px] font-medium active:opacity-70"
          >
            {t('purchase.addItem')}
          </button>
        </div>

        {draft.items.length === 0 ? (
          <div className="text-center py-[20px] text-[#707579] text-[15px]">
            {t('purchase.noItems')}
          </div>
        ) : (
          <div>
            {draft.items.map((item, index) => (
              <PurchaseItemRow
                key={index}
                item={item}
                products={products}
                index={index}
                onUpdate={updateItem}
                onRemove={removeItem}
              />
            ))}
          </div>
        )}
      </TelegramCard>

      {/* Totals */}
      {draft.items.length > 0 && (
        <TelegramCard>
          <div className="space-y-[8px]">
            <div className="flex justify-between items-center">
              <div className="text-[15px] text-[#707579]">{t('purchase.subtotal')}</div>
              <div className="text-[15px]">{calculateSubtotal().toLocaleString()} ETB</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-[15px] text-[#707579]">{t('purchase.tax')}</div>
              <div className="text-[15px]">{calculateTax().toLocaleString()} ETB</div>
            </div>
            <div className="border-t border-[#e5e5e5] dark:border-[#3a3a3a] pt-[8px] mt-[8px]">
              <div className="flex justify-between items-center">
                <div className="text-[17px] font-semibold">{t('purchase.total')}</div>
                <div className="text-[20px] font-bold">{calculateTotal().toLocaleString()} ETB</div>
              </div>
            </div>
          </div>
        </TelegramCard>
      )}

      {/* Notes */}
      <TelegramCard>
        <TelegramInput
          label={t('purchase.notes')}
          value={draft.notes || ''}
          onChange={(value) => setNotes(value)}
          placeholder={t('purchase.notes')}
        />
      </TelegramCard>
    </div>
  )
}


