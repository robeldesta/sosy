'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useInvoiceStore } from '@/stores/invoiceStore'
import { TelegramInput } from '@/components/telegram/TelegramInput'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { InvoiceItemRow } from './InvoiceItemRow'
import { TotalsBox } from './TotalsBox'
import { ProductSearch } from './ProductSearch'
import { Product } from '@/lib/api/product'
import { validateRequired, validatePhone, validateInvoiceItems } from '@/lib/utils/validation'

interface InvoiceFormProps {
  products: Product[]
  onSubmit: (data: {
    customer_name: string
    customer_phone?: string
    items: Array<{
      stock_item_id: number
      quantity: number
      unit_price: number
    }>
  }) => Promise<void>
  loading?: boolean
}

export function InvoiceForm({ products, onSubmit, loading = false }: InvoiceFormProps) {
  const { t } = useTranslation()
  const {
    draft,
    setCustomerName,
    setCustomerPhone,
    addItem,
    updateItem,
    removeItem,
    calculateSubtotal,
    calculateTax,
    calculateTotal,
  } = useInvoiceStore()
  const [showProductSearch, setShowProductSearch] = useState(false)

  // Get recently used products (last 5 products added to invoices)
  const recentProducts = products.slice(0, 5)

  const handleAddItem = () => {
    addItem({
      product_id: 0,
      quantity: 0,
      unit_price: 0,
    })
  }

  const handleSelectProduct = (product: Product) => {
    addItem({
      product_id: product.id,
      quantity: 1,
      unit_price: product.selling_price,
    })
  }

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: Record<string, string> = {}
    
    // Validate customer name
    const nameError = validateRequired(draft.customer_name, t('invoice.customerName'))
    if (nameError) newErrors.customer_name = nameError
    
    // Validate phone if provided
    if (draft.customer_phone) {
      const phoneError = validatePhone(draft.customer_phone)
      if (phoneError) newErrors.customer_phone = phoneError
    }
    
    // Validate items
    const itemsForValidation = draft.items
      .filter(item => item.product_id > 0 && item.quantity > 0 && item.unit_price > 0)
      .map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }))
    
    const itemsError = validateInvoiceItems(itemsForValidation)
    if (itemsError) newErrors.items = itemsError
    
    setErrors(newErrors)
    
    if (Object.keys(newErrors).length > 0) {
      return
    }

    await onSubmit({
      customer_name: draft.customer_name,
      customer_phone: draft.customer_phone || undefined,
      items: itemsForValidation.map(item => ({
        stock_item_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    })
  }

  const isValid =
    draft.customer_name.trim() !== '' &&
    draft.items.length > 0 &&
    draft.items.every(item => item.product_id > 0 && item.quantity > 0 && item.unit_price > 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-[8px]">
      {/* Customer Info */}
      <TelegramCard>
        <TelegramInput
          label={t('invoice.customerName')}
          value={draft.customer_name}
          onChange={setCustomerName}
          placeholder={t('invoice.customerName')}
          required
        />
        <TelegramInput
          label={t('invoice.customerPhone')}
          type="tel"
          value={draft.customer_phone}
          onChange={setCustomerPhone}
          placeholder="+251..."
        />
      </TelegramCard>

      {/* Items */}
      <TelegramCard className="mb-[8px]">
        <div className="flex justify-between items-center mb-[12px]">
          <div className="text-[17px] font-medium" suppressHydrationWarning>{t('invoice.items')}</div>
          <div className="flex gap-[8px]">
            <button
              type="button"
              onClick={() => setShowProductSearch(true)}
              className="text-[#3390ec] text-[15px] font-medium active:opacity-70"
              suppressHydrationWarning
            >
              {t('invoice.searchProducts')}
            </button>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-[#3390ec] text-[15px] font-medium active:opacity-70"
              suppressHydrationWarning
            >
              {t('invoice.addItem')}
            </button>
          </div>
        </div>

        {/* Recent Products */}
        {recentProducts.length > 0 && draft.items.length === 0 && (
          <div className="mb-[12px]">
            <div className="text-[14px] text-[#707579] mb-[8px]" suppressHydrationWarning>
              {t('invoice.recentProducts')}
            </div>
            <div className="flex flex-wrap gap-[8px]">
              {recentProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleSelectProduct(product)}
                  className="px-[12px] py-[6px] bg-[#f0f0f0] dark:bg-[#2a2a2a] rounded-full text-[14px] active:opacity-70"
                  suppressHydrationWarning
                >
                  {product.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {draft.items.length === 0 ? (
          <div className="text-center py-[20px] text-[#707579] text-[15px]">
            {t('invoice.noItems')}
          </div>
        ) : (
          <div>
            {draft.items.map((item, index) => (
              <InvoiceItemRow
                key={index}
                item={item}
                index={index}
                products={products}
                onUpdate={updateItem}
                onRemove={removeItem}
              />
            ))}
          </div>
        )}
      </TelegramCard>

      {/* Totals */}
      {draft.items.length > 0 && (
        <TotalsBox
          subtotal={calculateSubtotal()}
          tax={calculateTax()}
          total={calculateTotal()}
        />
      )}

      {/* Product Search Modal */}
      {showProductSearch && (
        <ProductSearch
          products={products}
          onSelect={handleSelectProduct}
          onClose={() => setShowProductSearch(false)}
        />
      )}
    </form>
  )
}

