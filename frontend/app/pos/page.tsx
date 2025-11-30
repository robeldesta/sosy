'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useMainButton } from '@/hooks/useMainButton'
import { posApi, POSProduct, CartItem, CheckoutRequest } from '@/lib/api/pos'
import { showToast } from '@/lib/utils/toast'
import { debounce } from '@/lib/utils/debounce'
import { syncQueue } from '@/lib/sync/syncQueue'

interface CartItemLocal extends CartItem {
  id: string // Local ID for optimistic updates
}

export default function POSPage() {
  const router = useRouter()
  const { webApp, themeParams } = useTelegramWebApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState<POSProduct[]>([])
  const [cart, setCart] = useState<CartItemLocal[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  // Local cache for products
  const [productCache, setProductCache] = useState<Map<number, POSProduct>>(new Map())

  // Debounced search (150ms)
  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        if (!query.trim()) {
          setProducts([])
          setIsSearching(false)
          return
        }

        setIsSearching(true)
        try {
          const results = await posApi.searchProducts(query, 20)
          setProducts(results)
          
          // Update cache
          const newCache = new Map(productCache)
          results.forEach(p => newCache.set(p.id, p))
          setProductCache(newCache)
        } catch (error: any) {
          showToast('Search failed', 'error')
          setProducts([])
        } finally {
          setIsSearching(false)
        }
      }, 150),
    [productCache]
  )

  // Search handler
  useEffect(() => {
    debouncedSearch(searchQuery)
    return () => {
      debouncedSearch.cancel()
    }
  }, [searchQuery, debouncedSearch])

  // Setup BackButton
  useEffect(() => {
    if (webApp?.BackButton) {
      webApp.BackButton.show()
      const handleBack = () => router.push('/dashboard')
      webApp.BackButton.onClick(handleBack)

      return () => {
        webApp.BackButton.offClick(handleBack)
        webApp.BackButton.hide()
      }
    }
  }, [webApp, router])

  // Setup MainButton for checkout
  const handleCheckout = useCallback(() => {
    if (cart.length === 0) {
      showToast('Cart is empty', 'error')
      return
    }
    setShowPaymentModal(true)
  }, [cart])

  useMainButton({
    text: cart.length > 0 ? `Checkout (${cart.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)})` : 'Add items to cart',
    onClick: handleCheckout,
    isActive: cart.length > 0,
    isVisible: true,
  })

  // Add to cart
  const addToCart = useCallback((product: POSProduct) => {
    const existingItem = cart.find(item => item.product_id === product.id)
    
    if (existingItem) {
      // Increase quantity
      setCart(prev => prev.map(item =>
        item.id === existingItem.id
          ? {
              ...item,
              quantity: item.quantity + 1,
              subtotal: (item.quantity + 1) * item.unit_price
            }
          : item
      ))
    } else {
      // Add new item
      const newItem: CartItemLocal = {
        id: `${product.id}-${Date.now()}`,
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price,
        subtotal: product.price,
        stock_available: product.stock
      }
      setCart(prev => [...prev, newItem])
    }

    webApp?.HapticFeedback?.impactOccurred('light')
    showToast(`${product.name} added`, 'success')
  }, [cart, webApp])

  // Update quantity
  const updateQuantity = useCallback((itemId: string, delta: number) => {
    setCart(prev => {
      const item = prev.find(i => i.id === itemId)
      if (!item) return prev

      const newQuantity = Math.max(1, item.quantity + delta)
      if (newQuantity > item.stock_available) {
        showToast('Insufficient stock', 'error')
        return prev
      }

      return prev.map(i =>
        i.id === itemId
          ? {
              ...i,
              quantity: newQuantity,
              subtotal: newQuantity * i.unit_price
            }
          : i
      )
    })
    webApp?.HapticFeedback?.selectionChanged()
  }, [webApp])

  // Remove from cart
  const removeFromCart = useCallback((itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId))
    webApp?.HapticFeedback?.impactOccurred('light')
  }, [webApp])

  // Calculate totals
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0)
  }, [cart])

  // Process checkout
  const processCheckout = async (paymentMethod: string, customerName?: string, customerPhone?: string) => {
    setIsCheckingOut(true)
    
    const checkoutData: CheckoutRequest = {
      items: cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price
      })),
      payment_method: paymentMethod as any,
      customer_name: customerName,
      customer_phone: customerPhone
    }

    // Try online checkout first
    try {
      const result = await posApi.checkout(checkoutData)
      
      webApp?.HapticFeedback?.notificationOccurred('success')
      showToast(`Sale complete! Total: ${result.total.toFixed(2)}`, 'success')
      
      // Clear cart
      setCart([])
      setSearchQuery('')
      setProducts([])
      
      // Show success screen briefly, then return to search
      setTimeout(() => {
        setShowPaymentModal(false)
      }, 2000)
    } catch (error: any) {
      // If offline or network error, add to sync queue
      if (!navigator.onLine || error.code === 'NETWORK_ERROR' || !error.response) {
        // Add to sync queue for offline processing
        syncQueue.add('sale', checkoutData)
        
        webApp?.HapticFeedback?.notificationOccurred('success')
        showToast(`Sale queued for sync! Total: ${cartTotal.toFixed(2)}`, 'success')
        
        // Clear cart
        setCart([])
        setSearchQuery('')
        setProducts([])
        
        setTimeout(() => {
          setShowPaymentModal(false)
        }, 2000)
      } else {
        webApp?.HapticFeedback?.notificationOccurred('error')
        showToast(error.response?.data?.detail || 'Checkout failed', 'error')
      }
    } finally {
      setIsCheckingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--tg-theme-bg-color,#ffffff)] flex flex-col">
      {/* Search Bar */}
      <div className="sticky top-0 z-10 bg-[var(--tg-theme-bg-color,#ffffff)] border-b border-[var(--tg-theme-secondary-bg-color,#f0f0f0)] px-4 py-3">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)] rounded-[12px] px-4 py-3 pl-10 text-[17px] text-[var(--tg-theme-text-color,#000000)] placeholder-[var(--tg-theme-hint-color,#999999)] focus:outline-none focus:ring-2 focus:ring-[#3390ec]"
            autoFocus
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--tg-theme-hint-color,#999999)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-[#3390ec] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Products List */}
        <div className="flex-1 overflow-y-auto pb-20">
          {products.length === 0 && !isSearching && searchQuery && (
            <div className="p-8 text-center">
              <p className="text-[var(--tg-theme-hint-color,#999999)] text-[15px]">
                No products found
              </p>
            </div>
          )}

          {products.length === 0 && !searchQuery && (
            <div className="p-8 text-center">
              <p className="text-[var(--tg-theme-hint-color,#999999)] text-[15px]">
                Start typing to search products...
              </p>
            </div>
          )}

          <div className="divide-y divide-[var(--tg-theme-secondary-bg-color,#f0f0f0)]">
            {products.map((product) => {
              const inCart = cart.find(item => item.product_id === product.id)
              const cartQuantity = inCart?.quantity || 0

              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="w-full p-4 text-left hover:bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)] active:bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-[17px] font-medium text-[var(--tg-theme-text-color,#000000)] truncate">
                        {product.name}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[15px] font-semibold text-[#3390ec]">
                          {product.price.toFixed(2)}
                        </span>
                        <span className="text-[13px] text-[var(--tg-theme-hint-color,#999999)]">
                          Stock: {product.stock}
                        </span>
                      </div>
                    </div>
                    {cartQuantity > 0 && (
                      <div className="ml-3 bg-[#3390ec] text-white rounded-full w-8 h-8 flex items-center justify-center text-[15px] font-semibold">
                        {cartQuantity}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Cart Sidebar */}
        {cart.length > 0 && (
          <div className="w-full md:w-80 border-l border-[var(--tg-theme-secondary-bg-color,#f0f0f0)] bg-[var(--tg-theme-bg-color,#ffffff)] flex flex-col">
            <div className="p-4 border-b border-[var(--tg-theme-secondary-bg-color,#f0f0f0)]">
              <h2 className="text-[20px] font-semibold text-[var(--tg-theme-text-color,#000000)]">
                Cart ({cart.length})
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border-b border-[var(--tg-theme-secondary-bg-color,#f0f0f0)]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-medium text-[var(--tg-theme-text-color,#000000)] truncate">
                        {item.product_name}
                      </div>
                      <div className="text-[13px] text-[var(--tg-theme-hint-color,#999999)] mt-1">
                        {item.unit_price.toFixed(2)} × {item.quantity}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="ml-2 p-1 text-[var(--tg-theme-hint-color,#999999)] hover:text-[#ff3b30]"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 rounded-full bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)] flex items-center justify-center text-[var(--tg-theme-text-color,#000000)] font-semibold"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-[15px] font-medium text-[var(--tg-theme-text-color,#000000)]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 rounded-full bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)] flex items-center justify-center text-[var(--tg-theme-text-color,#000000)] font-semibold"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-[17px] font-semibold text-[var(--tg-theme-text-color,#000000)]">
                      {item.subtotal.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-[var(--tg-theme-secondary-bg-color,#f0f0f0)] bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[17px] font-semibold text-[var(--tg-theme-text-color,#000000)]">
                  Total:
                </span>
                <span className="text-[24px] font-bold text-[var(--tg-theme-text-color,#000000)]">
                  {cartTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          total={cartTotal}
          onClose={() => setShowPaymentModal(false)}
          onCheckout={processCheckout}
          isProcessing={isCheckingOut}
        />
      )}
    </div>
  )
}

// Payment Modal Component
function PaymentModal({
  total,
  onClose,
  onCheckout,
  isProcessing,
}: {
  total: number
  onClose: () => void
  onCheckout: (method: string, customerName?: string, customerPhone?: string) => void
  isProcessing: boolean
}) {
  const { themeParams } = useTelegramWebApp()
  const [selectedMethod, setSelectedMethod] = useState<string>('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  const paymentMethods = [
    { id: 'cash', name: 'Cash', icon: '💵' },
    { id: 'mobile_money', name: 'Mobile Money', icon: '📱' },
    { id: 'card', name: 'Card', icon: '💳' },
    { id: 'credit', name: 'On Credit', icon: '📝' },
  ]

  const handleSubmit = () => {
    if (!selectedMethod) {
      showToast('Please select payment method', 'error')
      return
    }
    onCheckout(selectedMethod, customerName || undefined, customerPhone || undefined)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="w-full bg-[var(--tg-theme-bg-color,#ffffff)] rounded-t-[20px] p-4 pb-safe max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-semibold text-[var(--tg-theme-text-color,#000000)]">
            Payment
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)] rounded-[12px] p-4 mb-6">
          <div className="text-[15px] text-[var(--tg-theme-hint-color,#999999)] mb-1">Total</div>
          <div className="text-[28px] font-bold text-[var(--tg-theme-text-color,#000000)]">
            {total.toFixed(2)}
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`w-full p-4 rounded-[12px] border-2 transition-all ${
                selectedMethod === method.id
                  ? 'border-[#3390ec] bg-[#3390ec]/10'
                  : 'border-[var(--tg-theme-secondary-bg-color,#f0f0f0)] bg-[var(--tg-theme-bg-color,#ffffff)]'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">{method.icon}</div>
                <div className="flex-1 text-left">
                  <div className="text-[17px] font-medium text-[var(--tg-theme-text-color,#000000)]">
                    {method.name}
                  </div>
                </div>
                {selectedMethod === method.id && (
                  <div className="w-6 h-6 rounded-full bg-[#3390ec] flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {(selectedMethod === 'credit' || selectedMethod === 'mobile_money') && (
          <div className="space-y-3 mb-6">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name (optional)"
              className="w-full bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)] rounded-[12px] px-4 py-3 text-[17px] text-[var(--tg-theme-text-color,#000000)] placeholder-[var(--tg-theme-hint-color,#999999)] focus:outline-none"
            />
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Phone number (optional)"
              className="w-full bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)] rounded-[12px] px-4 py-3 text-[17px] text-[var(--tg-theme-text-color,#000000)] placeholder-[var(--tg-theme-hint-color,#999999)] focus:outline-none"
            />
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!selectedMethod || isProcessing}
          className="w-full bg-[#3390ec] text-white rounded-full py-4 text-[17px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: themeParams?.button_color || '#3390ec',
            color: themeParams?.button_text_color || '#ffffff',
          }}
        >
          {isProcessing ? 'Processing...' : `Pay ${total.toFixed(2)}`}
        </button>
      </div>
    </div>
  )
}

