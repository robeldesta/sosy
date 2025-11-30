'use client'

import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { invoiceApi } from '@/lib/api/invoice'
import { InvoiceForm } from '@/components/invoice/InvoiceForm'
import { BackButton } from '@/components/telegram/BackButton'
import { useProductStore } from '@/stores/productStore'
import { useInvoiceStore } from '@/stores/invoiceStore'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useBackButton } from '@/hooks/useBackButton'
import { useMainButton } from '@/hooks/useMainButton'
import { useToastStore } from '@/stores/toastStore'

export default function NewInvoicePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, webApp } = useTelegramWebApp()
  const { products, fetchProducts } = useProductStore()
  const { draft, clearDraft, calculateSubtotal } = useInvoiceStore()
  const { addToast } = useToastStore()
  const [loading, setLoading] = useState(false)

  useBackButton()

  useEffect(() => {
    fetchProducts()
    clearDraft() // Reset draft on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isFormValid = 
    draft.customer_name.trim() !== '' &&
    draft.items.length > 0 &&
    draft.items.every(item => item.product_id > 0 && item.quantity > 0 && item.unit_price > 0)

  const handleSubmit = async () => {
    if (!isFormValid || loading) return

    setLoading(true)
    try {
      const invoiceData = {
        customer_name: draft.customer_name,
        customer_phone: draft.customer_phone || undefined,
        items: draft.items
          .filter(item => item.product_id > 0 && item.quantity > 0 && item.unit_price > 0)
          .map(item => ({
            stock_item_id: item.product_id, // TODO: Map to actual stock_item_id
            quantity: item.quantity,
            unit_price: item.unit_price,
          })),
      }

      if (invoiceData.items.length === 0) {
        webApp?.HapticFeedback?.notificationOccurred('error')
        addToast(t('invoice.noItems'), 'error')
        setLoading(false)
        return
      }

      const invoice = await invoiceApi.createInvoice(invoiceData)
      webApp?.HapticFeedback?.notificationOccurred('success')
      addToast(t('invoice.invoiceSentSaved'), 'success')
      clearDraft()
      router.push(`/invoice/${invoice.id}`)
    } catch (error: any) {
      webApp?.HapticFeedback?.notificationOccurred('error')
      addToast(
        error.response?.data?.detail || t('invoice.createError'),
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  useMainButton({
    text: t('invoice.createInvoice'),
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
              {t('invoice.createNew')}
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
        <InvoiceForm
          products={products}
          onSubmit={handleSubmit}
          loading={loading}
        />
      </div>
    </div>
  )
}
