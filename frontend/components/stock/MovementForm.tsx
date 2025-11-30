'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { inventoryApi, CreateMovement } from '@/lib/api/inventory'
import { useProductStore } from '@/stores/productStore'
import { useToastStore } from '@/stores/toastStore'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { TelegramInput } from '@/components/telegram/TelegramInput'

interface MovementFormProps {
  productId?: number
  onSuccess?: () => void
}

export function MovementForm({ productId, onSuccess }: MovementFormProps) {
  const { t } = useTranslation()
  const { products, fetchStock, fetchProducts } = useProductStore()
  const { webApp } = useTelegramWebApp()
  const { addToast } = useToastStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateMovement>({
    product_id: productId || 0,
    movement_type: 'purchase_add',
    quantity: 0,
    reference: '',
  })

  useEffect(() => {
    if (products.length === 0) {
      fetchProducts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const movementTypes = [
    { value: 'purchase_add', label: t('stock.movementTypes.purchase') },
    { value: 'sale', label: t('stock.movementTypes.sale') },
    { value: 'adjustment_up', label: t('stock.movementTypes.adjustmentUp') },
    { value: 'adjustment_down', label: t('stock.movementTypes.adjustmentDown') },
    { value: 'return_in', label: t('stock.movementTypes.returnIn') },
    { value: 'return_out', label: t('stock.movementTypes.returnOut') },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.product_id || formData.quantity <= 0) return

    setLoading(true)

    try {
      await inventoryApi.createMovement(formData)
      webApp?.HapticFeedback?.notificationOccurred('success')
      addToast(t('stock.movementRecorded'), 'success')
      await fetchStock()
      if (onSuccess) {
        onSuccess()
      }
      // Reset form
      setFormData({
        product_id: productId || 0,
        movement_type: 'purchase_add',
        quantity: 0,
        reference: '',
      })
    } catch (error: any) {
      webApp?.HapticFeedback?.notificationOccurred('error')
      addToast(
        error.response?.data?.detail || t('stock.movementError'),
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-[4px]">
      {!productId && (
        <div className="mb-[16px]">
          <label className="block text-[14px] text-[#707579] dark:text-[#707579] mb-[6px]">
            {t('stock.product')} *
          </label>
          <select
            required
            value={formData.product_id}
            onChange={(e) => setFormData({ ...formData, product_id: parseInt(e.target.value) })}
            className="w-full px-[14px] py-[10px] text-[17px] bg-transparent border-b border-[#e5e5e5] dark:border-[#3a3a3a] focus:outline-none focus:border-[#3390ec]"
          >
            <option value={0}>{t('stock.selectProduct')}</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} {product.sku && `(${product.sku})`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mb-[16px]">
        <label className="block text-[14px] text-[#707579] dark:text-[#707579] mb-[6px]">
          {t('stock.movementType')} *
        </label>
        <select
          required
          value={formData.movement_type}
          onChange={(e) => setFormData({ ...formData, movement_type: e.target.value })}
          className="w-full px-[14px] py-[10px] text-[17px] bg-transparent border-b border-[#e5e5e5] dark:border-[#3a3a3a] focus:outline-none focus:border-[#3390ec]"
        >
          {movementTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <TelegramInput
        label={t('stock.quantity')}
        type="number"
        value={formData.quantity || ''}
        onChange={(value) => setFormData({ ...formData, quantity: parseFloat(value) || 0 })}
        placeholder="0"
        required
      />

      <TelegramInput
        label={t('stock.reference')}
        value={formData.reference || ''}
        onChange={(value) => setFormData({ ...formData, reference: value })}
        placeholder={t('stock.referencePlaceholder')}
      />

      <button
        type="submit"
        disabled={loading || !formData.product_id || formData.quantity <= 0}
        className="w-full mt-[16px] rounded-full bg-[#3390ec] text-white px-[20px] py-[10px] text-[17px] font-medium disabled:opacity-50"
      >
        {loading ? t('common.saving') : t('stock.recordMovement')}
      </button>
    </form>
  )
}
