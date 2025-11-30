'use client'

import { useTranslation } from 'react-i18next'
import { StockItem } from '@/lib/api/inventory'
import { Product } from '@/lib/api/product'
import Link from 'next/link'

interface ProductListProps {
  stockItems: StockItem[]
  products: Product[]
  loading?: boolean
}

export function ProductList({ stockItems, products, loading }: ProductListProps) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    )
  }

  if (stockItems.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="mb-4">{t('stock.noItems')}</p>
        <Link
          href="/stock/add"
          className="text-blue-500 hover:text-blue-600 underline"
        >
          {t('stock.addFirstProduct')}
        </Link>
      </div>
    )
  }

  // Create a map of products by ID for quick lookup
  const productMap = new Map(products.map(p => [p.id, p]))

  return (
    <div className="space-y-4">
      {stockItems.map((item) => {
        const product = productMap.get(item.product_id)
        const isLowStock = product && product.low_stock_threshold 
          ? item.quantity <= product.low_stock_threshold 
          : false

        return (
          <div
            key={item.id}
            className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{item.product_name}</h3>
                  {item.product_sku && (
                    <span className="text-sm text-gray-500">({item.product_sku})</span>
                  )}
                  {isLowStock && (
                    <span className="px-2 py-1 text-xs font-semibold bg-red-500 text-white rounded">
                      {t('stock.lowStock')}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">{t('stock.quantity')}:</span>
                    <span className="ml-2 font-semibold">
                      {item.quantity.toLocaleString()} {item.unit_of_measure}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('stock.location')}:</span>
                    <span className="ml-2">{item.location}</span>
                  </div>
                  {product && (
                    <>
                      <div>
                        <span className="text-gray-500">{t('stock.buyingPrice')}:</span>
                        <span className="ml-2">{product.buying_price.toLocaleString()} ETB</span>
                      </div>
                      <div>
                        <span className="text-gray-500">{t('stock.sellingPrice')}:</span>
                        <span className="ml-2">{product.selling_price.toLocaleString()} ETB</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

