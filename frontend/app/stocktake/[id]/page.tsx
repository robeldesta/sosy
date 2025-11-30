'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useMainButton } from '@/hooks/useMainButton'
import { stockTakeApi, StockTakeSession, StockTakeLine } from '@/lib/api/stockTake'
import { productApi } from '@/lib/api/product'
import { posApi } from '@/lib/api/pos'
import { showToast } from '@/lib/utils/toast'
import { debounce } from '@/lib/utils/debounce'
import { storeLocalCounts, getLocalCounts, clearLocalCounts, queueStockTakeCounts } from '@/lib/sync/stockTakeSync'
import { isOnline } from '@/lib/utils/offline'

interface Product {
  id: number
  name: string
  current_stock: number
  sale_price: number
  stock?: number
  price?: number
}

export default function StockTakeSessionPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = parseInt(params.id as string)
  const { t } = useTranslation()
  const { webApp } = useTelegramWebApp()
  const [session, setSession] = useState<StockTakeSession | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [counts, setCounts] = useState<Map<number, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showCountModal, setShowCountModal] = useState(false)
  const [countInput, setCountInput] = useState('')

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        if (!query.trim()) {
          loadProducts()
          return
        }
        try {
          const results = await posApi.searchProducts(query, 50)
          // Map POSProduct to Product interface
          const mappedProducts: Product[] = results.map(p => ({
            id: p.id,
            name: p.name,
            current_stock: p.stock,
            sale_price: p.price,
            stock: p.stock,
            price: p.price,
          }))
          setProducts(mappedProducts)
        } catch (error) {
          console.error('Search failed:', error)
        }
      }, 300),
    []
  )

  useEffect(() => {
    if (sessionId) {
      loadSession()
      loadProducts()
      loadLocalCounts()
    }
  }, [sessionId])

  useEffect(() => {
    if (searchQuery !== undefined) {
      debouncedSearch(searchQuery)
    }
  }, [searchQuery, debouncedSearch])

  const loadSession = async () => {
    try {
      const data = await stockTakeApi.getSession(sessionId)
      setSession(data)
      
      // Load counts from session
      if (data.lines) {
        const countsMap = new Map<number, number>()
        data.lines.forEach(line => {
          if (line.counted_qty !== null) {
            countsMap.set(line.product_id, line.counted_qty)
          }
        })
        setCounts(countsMap)
      }
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'Failed to load session', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const data = await productApi.getProducts()
      // Map Product to Product interface
      const mappedProducts: Product[] = data.map(p => ({
        id: p.id,
        name: p.name,
        current_stock: 0, // Will be loaded from stock API if needed
        sale_price: p.selling_price,
        stock: 0,
        price: p.selling_price,
      }))
      setProducts(mappedProducts)
    } catch (error) {
      console.error('Failed to load products:', error)
    }
  }

  const loadLocalCounts = () => {
    const localCounts = getLocalCounts(sessionId)
    const countsMap = new Map<number, number>()
    localCounts.forEach(c => {
      countsMap.set(c.product_id, c.counted_qty)
    })
    setCounts(prev => {
      const merged = new Map(prev)
      countsMap.forEach((value, key) => merged.set(key, value))
      return merged
    })
  }

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    setCountInput(counts.get(product.id)?.toString() || '')
    setShowCountModal(true)
  }

  const handleSaveCount = async () => {
    if (!selectedProduct) return
    
    const countedQty = parseInt(countInput)
    if (isNaN(countedQty) || countedQty < 0) {
      showToast('Invalid count', 'error')
      return
    }

    // Update local state
    setCounts(prev => {
      const updated = new Map(prev)
      updated.set(selectedProduct.id, countedQty)
      return updated
    })

    // Store locally
    storeLocalCounts(sessionId, [
      {
        session_id: sessionId,
        product_id: selectedProduct.id,
        counted_qty: countedQty,
      },
    ])

    // Try to sync if online
    if (isOnline()) {
      try {
        await stockTakeApi.addCounts(sessionId, {
          lines: [
            {
              product_id: selectedProduct.id,
              counted_qty: countedQty,
            },
          ],
        })
        webApp?.HapticFeedback?.notificationOccurred('success')
      } catch (error: any) {
        // Queue for sync if fails
        queueStockTakeCounts([
          {
            session_id: sessionId,
            product_id: selectedProduct.id,
            counted_qty: countedQty,
          },
        ])
      }
    } else {
      // Queue for offline sync
      queueStockTakeCounts([
        {
          session_id: sessionId,
          product_id: selectedProduct.id,
          counted_qty: countedQty,
        },
      ])
    }

    setShowCountModal(false)
    setSelectedProduct(null)
    setCountInput('')
  }

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products
    const query = searchQuery.toLowerCase()
    return products.filter(p => p.name.toLowerCase().includes(query))
  }, [products, searchQuery])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e5e5] p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-semibold text-[#000000]">
            {t('stockTake.counting', 'Counting')} #{sessionId}
          </h1>
          <button
            onClick={() => router.push('/stocktake')}
            className="text-[#3390ec] text-sm font-medium"
          >
            {t('common.back', 'Back')}
          </button>
        </div>
        
        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('stockTake.searchProducts', 'Search products...')}
          className="w-full bg-[#f7f7f7] rounded-lg px-4 py-2 text-sm text-[#000000] placeholder-[#707579] border-none outline-none"
        />
      </div>

      {/* Products List */}
      <div className="p-4">
        <div className="space-y-2">
          {filteredProducts.map(product => {
            const counted = counts.get(product.id)
            const expectedStock = (product.stock ?? product.current_stock) || 0
            const difference = counted !== undefined ? counted - expectedStock : null
            
            return (
              <button
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="w-full bg-white rounded-xl p-4 text-left active:opacity-80 transition-opacity"
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1">
                    <p className="font-medium text-[#000000]">{product.name}</p>
                    <p className="text-xs text-[#707579] mt-1">
                      {t('stockTake.expected', 'Expected')}: {product.stock ?? product.current_stock ?? 0}
                    </p>
                  </div>
                  {counted !== undefined && (
                    <div className="ml-4 text-right">
                      <p className="font-semibold text-[#000000]">{counted}</p>
                      {difference !== null && difference !== 0 && (
                        <p
                          className={`text-xs ${
                            difference < 0 ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {difference > 0 ? '+' : ''}
                          {difference}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {counted === undefined && (
                  <div className="mt-2 text-xs text-[#707579]">
                    {t('stockTake.tapToCount', 'Tap to count')}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Count Modal */}
      {showCountModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-[#000000] mb-4">
              {selectedProduct.name}
            </h2>
            <p className="text-sm text-[#707579] mb-6">
              {t('stockTake.expected', 'Expected')}: {selectedProduct.current_stock}
            </p>
            
            <input
              type="number"
              value={countInput}
              onChange={(e) => setCountInput(e.target.value)}
              placeholder={t('stockTake.enterCount', 'Enter count')}
              className="w-full bg-[#f7f7f7] rounded-xl px-4 py-4 text-lg text-[#000000] border-none outline-none mb-4"
              autoFocus
            />
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCountModal(false)
                  setSelectedProduct(null)
                  setCountInput('')
                }}
                className="flex-1 bg-[#f7f7f7] text-[#000000] rounded-xl py-3 font-medium active:opacity-80"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleSaveCount}
                className="flex-1 bg-[#3390ec] text-white rounded-xl py-3 font-medium active:opacity-80"
              >
                {t('common.save', 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

