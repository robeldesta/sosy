'use client'

import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { purchaseApi } from '@/lib/api/purchase'
import { supplierApi, Supplier } from '@/lib/api/supplier'
import { productApi, Product } from '@/lib/api/product'
import { PurchaseForm } from '@/components/purchase/PurchaseForm'
import { BackButton } from '@/components/telegram/BackButton'
import { useProductStore } from '@/stores/productStore'
import { usePurchaseStore } from '@/stores/purchaseStore'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useBackButton } from '@/hooks/useBackButton'
import { useMainButton } from '@/hooks/useMainButton'
import { useToastStore } from '@/stores/toastStore'

export default function NewPurchasePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, webApp } = useTelegramWebApp()
  const { products, fetchProducts } = useProductStore()
  const { draft, clearDraft, calculateSubtotal } = usePurchaseStore()
  const { addToast } = useToastStore()
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])

  useBackButton()

  useEffect(() => {
    fetchProducts()
    loadSuppliers()
    clearDraft()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadSuppliers = async () => {
    try {
      const data = await supplierApi.getSuppliers()
      setSuppliers(data)
    } catch (error) {
      console.error('Failed to load suppliers:', error)
    }
  }

  const isFormValid =
    draft.supplier_id > 0 &&
    draft.items.length > 0 &&
    draft.items.every(item => item.product_id > 0 && item.quantity > 0 && item.unit_cost > 0)

  const handleSubmit = async () => {
    if (!isFormValid || loading) return

    setLoading(true)
    try {
      const purchaseData = {
        supplier_id: draft.supplier_id,
        date: draft.date || undefined,
        notes: draft.notes || undefined,
        status: 'draft',
        items: draft.items
          .filter(item => item.product_id > 0 && item.quantity > 0 && item.unit_cost > 0)
          .map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
          })),
      }

      if (purchaseData.items.length === 0) {
        webApp?.HapticFeedback?.notificationOccurred('error')
        addToast(t('purchase.noItems'), 'error')
        setLoading(false)
        return
      }

      const purchase = await purchaseApi.createPurchase(purchaseData)
      webApp?.HapticFeedback?.notificationOccurred('success')
      addToast(t('purchase.created'), 'success')
      clearDraft()
      router.push(`/purchase/${purchase.id}`)
    } catch (error: any) {
      webApp?.HapticFeedback?.notificationOccurred('error')
      addToast(
        error.response?.data?.detail || t('purchase.createError'),
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  useMainButton({
    text: t('purchase.createPurchase'),
    isActive: isFormValid && !loading,
    isVisible: true,
    onClick: handleSubmit,
  })

  return (
    <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] pb-[80px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#212121] border-b border-[#e5e5e5] dark:border-[#3a3a3a]">
        <div className="flex items-center px-[14px] py-[12px]">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-[20px] font-semibold leading-[24px]">
              {t('purchase.createNew')}
            </h1>
            {user?.first_name && (
              <div className="text-[14px] text-[#707579] mt-[2px]">
                {user.first_name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-[14px] pt-[8px]">
        <PurchaseForm suppliers={suppliers} products={products} loading={loading} />
      </div>
    </div>
  )
}


