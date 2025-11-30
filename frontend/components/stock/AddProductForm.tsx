'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import { productApi, CreateProduct } from '@/lib/api/product'
import { inventoryApi } from '@/lib/api/inventory'
import { useProductStore } from '@/stores/productStore'
import { useToastStore } from '@/stores/toastStore'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { TelegramInput } from '@/components/telegram/TelegramInput'

interface AddProductFormProps {
  onFormValidChange?: (isValid: boolean) => void
}

export function AddProductForm({ onFormValidChange }: AddProductFormProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const { webApp } = useTelegramWebApp()
  const { addProduct, fetchProducts, fetchStock } = useProductStore()
  const { addToast } = useToastStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateProduct & { initialQuantity: number }>({
    name: '',
    sku: '',
    category: '',
    unit_of_measure: 'pcs',
    buying_price: 0,
    selling_price: 0,
    low_stock_threshold: undefined,
    is_active: true,
    initialQuantity: 0,
  })

  // Validate form
  useEffect(() => {
    const isValid = 
      formData.name.trim() !== '' &&
      formData.unit_of_measure.trim() !== '' &&
      formData.buying_price > 0 &&
      formData.selling_price > 0
    
    onFormValidChange?.(isValid)
  }, [formData, onFormValidChange])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create product
      const product = await productApi.createProduct({
        name: formData.name,
        sku: formData.sku || undefined,
        category: formData.category || undefined,
        unit_of_measure: formData.unit_of_measure,
        buying_price: formData.buying_price,
        selling_price: formData.selling_price,
        low_stock_threshold: formData.low_stock_threshold || undefined,
        is_active: formData.is_active,
      })

      addProduct(product)
      webApp?.HapticFeedback?.notificationOccurred('success')
      addToast(t('stock.productCreated'), 'success')

      // If initial quantity is provided, create a stock movement
      if (formData.initialQuantity > 0) {
        await inventoryApi.createMovement({
          product_id: product.id,
          movement_type: 'purchase_add',
          quantity: formData.initialQuantity,
          reference: t('stock.initialStock'),
        })
        await fetchStock()
      }

      await fetchProducts()
      router.push('/stock')
    } catch (error: any) {
      webApp?.HapticFeedback?.notificationOccurred('error')
      addToast(
        error.response?.data?.detail || t('stock.createError'),
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-[4px]">
      <TelegramInput
        label={t('stock.productName')}
        value={formData.name}
        onChange={(value) => setFormData({ ...formData, name: value })}
        placeholder={t('stock.productName')}
        required
      />

      <div className="grid grid-cols-2 gap-[12px]">
        <TelegramInput
          label={t('stock.sku')}
          value={formData.sku || ''}
          onChange={(value) => setFormData({ ...formData, sku: value })}
          placeholder="SKU"
        />

        <TelegramInput
          label={t('stock.category')}
          value={formData.category || ''}
          onChange={(value) => setFormData({ ...formData, category: value })}
          placeholder={t('stock.category')}
        />
      </div>

      <TelegramInput
        label={t('stock.unitOfMeasure')}
        value={formData.unit_of_measure}
        onChange={(value) => setFormData({ ...formData, unit_of_measure: value })}
        placeholder="pcs, kg, liter"
        required
      />

      <div className="grid grid-cols-2 gap-[12px]">
        <TelegramInput
          label={t('stock.buyingPrice')}
          type="number"
          value={formData.buying_price || ''}
          onChange={(value) => setFormData({ ...formData, buying_price: parseFloat(value) || 0 })}
          placeholder="0"
          required
        />

        <TelegramInput
          label={t('stock.sellingPrice')}
          type="number"
          value={formData.selling_price || ''}
          onChange={(value) => setFormData({ ...formData, selling_price: parseFloat(value) || 0 })}
          placeholder="0"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-[12px]">
        <TelegramInput
          label={t('stock.lowStockThreshold')}
          type="number"
          value={formData.low_stock_threshold || ''}
          onChange={(value) => setFormData({ 
            ...formData, 
            low_stock_threshold: value ? parseFloat(value) : undefined 
          })}
          placeholder="0"
        />

        <TelegramInput
          label={t('stock.initialQuantity')}
          type="number"
          value={formData.initialQuantity || ''}
          onChange={(value) => setFormData({ ...formData, initialQuantity: parseFloat(value) || 0 })}
          placeholder="0"
        />
      </div>
    </form>
  )
}
