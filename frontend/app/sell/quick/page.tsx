'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import { quickSellApi } from '@/lib/api/quickSell'
import { productApi, Product } from '@/lib/api/product'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramInput } from '@/components/telegram/TelegramInput'
import { TelegramButton } from '@/components/telegram/TelegramButton'
import { BackButton } from '@/components/telegram/BackButton'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useBackButton } from '@/hooks/useBackButton'
import { useMainButton } from '@/hooks/useMainButton'
import { useToastStore } from '@/stores/toastStore'
import { useProductStore } from '@/stores/productStore'

export default function QuickSellPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, webApp } = useTelegramWebApp()
  const { addToast } = useToastStore()
  const { products, stockItems, fetchProducts, fetchStock } = useProductStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState<string>('')
  const [customerName, setCustomerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [invoiceNumber, setInvoiceNumber] = useState('')

  useBackButton()

  useEffect(() => {
    fetchProducts()
    fetchStock()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products.slice(0, 10)
    const query = searchQuery.toLowerCase()
    return products.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.sku?.toLowerCase().includes(query)
    ).slice(0, 10)
  }, [products, searchQuery])

  // Get stock for selected product
  const selectedProductStock = useMemo(() => {
    if (!selectedProduct) return 0
    const stock = stockItems.find(s => s.product_id === selectedProduct.id)
    return stock?.quantity || 0
  }, [selectedProduct, stockItems])

  const isFormValid = selectedProduct !== null && 
    quantity !== '' && 
    parseFloat(quantity) > 0 && 
    parseFloat(quantity) <= selectedProductStock &&
    !loading

  useMainButton({
    text: t('quickSell.sell'),
    isActive: isFormValid,
    isVisible: !success,
    onClick: handleSell,
  })

  async function handleSell() {
    if (!isFormValid || !selectedProduct) return

    setLoading(true)
    try {
      const invoice = await quickSellApi.quickSell({
        product_id: selectedProduct.id,
        quantity: parseFloat(quantity),
        customer_name: customerName || undefined,
      })
      
      webApp?.HapticFeedback?.notificationOccurred('success')
      setInvoiceNumber(invoice.invoice_number)
      setSuccess(true)
      addToast(t('quickSell.invoiceCreated'), 'success')
      
      // Refresh stock
      fetchStock()
    } catch (error: any) {
      webApp?.HapticFeedback?.notificationOccurred('error')
      const errorMessage = error.response?.data?.detail || t('quickSell.error')
      addToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] pb-[80px]">
        <div className="sticky top-0 z-10 bg-white dark:bg-[#212121] border-b border-[#e5e5e5] dark:border-[#3a3a3a]">
          <div className="flex items-center px-[14px] py-[12px]">
            <BackButton />
            <div className="flex-1">
              <h1 className="text-[20px] font-semibold leading-[24px]" suppressHydrationWarning>
                {t('quickSell.sold')}
              </h1>
            </div>
          </div>
        </div>

        <div className="px-[14px] pt-[8px]">
          <TelegramCard>
            <div className="text-center py-[40px]">
              <div className="text-[48px] mb-[16px]">✅</div>
              <div className="text-[17px] font-medium mb-[8px]" suppressHydrationWarning>
                {t('quickSell.invoiceCreated')}
              </div>
              <div className="text-[15px] text-[#707579]" suppressHydrationWarning>
                Invoice: {invoiceNumber}
              </div>
            </div>
          </TelegramCard>

          <div className="mt-[12px] space-y-[8px]">
            <TelegramButton
              variant="primary"
              fullWidth
              onClick={() => {
                setSuccess(false)
                setSelectedProduct(null)
                setQuantity('')
                setCustomerName('')
                setSearchQuery('')
              }}
            >
              {t('dashboard.newSale')}
            </TelegramButton>
            <TelegramButton
              variant="secondary"
              fullWidth
              onClick={() => router.push('/dashboard')}
            >
              {t('dashboard.title')}
            </TelegramButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] pb-[80px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#212121] border-b border-[#e5e5e5] dark:border-[#3a3a3a]">
        <div className="flex items-center px-[14px] py-[12px]">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-[20px] font-semibold leading-[24px]" suppressHydrationWarning>
              {t('quickSell.title')}
            </h1>
            {user?.first_name && (
              <div className="text-[14px] text-[#707579] mt-[2px]" suppressHydrationWarning>
                {user.first_name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-[14px] pt-[8px] space-y-[8px]">
        {/* Search */}
        <TelegramCard>
          <TelegramInput
            label={t('quickSell.searchProduct')}
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('quickSell.searchProduct')}
          />
        </TelegramCard>

        {/* Product Selection */}
        {!selectedProduct ? (
          <TelegramCard>
            <div className="text-[17px] font-medium mb-[12px]" suppressHydrationWarning>
              {t('quickSell.selectProduct')}
            </div>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-[20px] text-[#707579] text-[15px]" suppressHydrationWarning>
                {t('stock.noItems')}
              </div>
            ) : (
              <div className="space-y-[4px]">
                {filteredProducts.map((product) => {
                  const stock = stockItems.find(s => s.product_id === product.id)
                  const availableStock = stock?.quantity || 0
                  return (
                    <button
                      key={product.id}
                      onClick={() => {
                        setSelectedProduct(product)
                        setSearchQuery('')
                        webApp?.HapticFeedback?.impactOccurred('light')
                      }}
                      className="w-full text-left py-[12px] px-[14px] rounded-[12px] bg-[#f1f1f1] dark:bg-[#2a2a2a] active:opacity-70"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="text-[15px] font-medium" suppressHydrationWarning>
                            {product.name}
                          </div>
                          <div className="text-[13px] text-[#707579]" suppressHydrationWarning>
                            {product.selling_price.toLocaleString()} ETB
                          </div>
                        </div>
                        <div className="text-[14px] text-[#707579]" suppressHydrationWarning>
                          Stock: {availableStock.toFixed(1)}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </TelegramCard>
        ) : (
          <>
            {/* Selected Product Info */}
            <TelegramCard>
              <div className="flex justify-between items-start mb-[12px]">
                <div className="flex-1">
                  <div className="text-[17px] font-medium mb-[4px]" suppressHydrationWarning>
                    {selectedProduct.name}
                  </div>
                  <div className="text-[14px] text-[#707579]" suppressHydrationWarning>
                    {selectedProduct.selling_price.toLocaleString()} ETB per {selectedProduct.unit_of_measure}
                  </div>
                  <div className="text-[14px] text-[#707579] mt-[4px]" suppressHydrationWarning>
                    Available: {selectedProductStock.toFixed(1)} {selectedProduct.unit_of_measure}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedProduct(null)
                    setQuantity('')
                    webApp?.HapticFeedback?.impactOccurred('light')
                  }}
                  className="text-[#3390ec] text-[14px]"
                  suppressHydrationWarning
                >
                  {t('common.edit')}
                </button>
              </div>
            </TelegramCard>

            {/* Quantity Input */}
            <TelegramCard>
              <TelegramInput
                label={t('quickSell.quantity')}
                type="number"
                value={quantity}
                onChange={setQuantity}
                placeholder="0"
                required
              />
              {quantity && parseFloat(quantity) > selectedProductStock && (
                <div className="text-[14px] text-[#ff3b30] mt-[4px]" suppressHydrationWarning>
                  {t('quickSell.insufficientStock')}
                </div>
              )}
              {quantity && parseFloat(quantity) > 0 && selectedProductStock >= parseFloat(quantity) && (
                <div className="text-[14px] text-[#707579] mt-[4px]" suppressHydrationWarning>
                  Total: {(parseFloat(quantity) * selectedProduct.selling_price * 1.15).toLocaleString()} ETB
                </div>
              )}
            </TelegramCard>

            {/* Customer Name (Optional) */}
            <TelegramCard>
              <TelegramInput
                label={t('quickSell.customerName')}
                value={customerName}
                onChange={setCustomerName}
                placeholder={t('quickSell.customerName')}
              />
            </TelegramCard>
          </>
        )}
      </div>
    </div>
  )
}

