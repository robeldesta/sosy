'use client'

import { useTranslation } from 'react-i18next'
import { Product } from '@/lib/api/product'

interface ProductSelectorProps {
  products: Product[]
  value: number
  onChange: (productId: number, product?: Product) => void
  className?: string
}

export function ProductSelector({ products, value, onChange, className = '' }: ProductSelectorProps) {
  const { t } = useTranslation()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = parseInt(e.target.value)
    const product = products.find(p => p.id === productId)
    onChange(productId, product)
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      className={`
        w-full
        px-[14px] py-[10px]
        text-[17px]
        bg-transparent
        border-b border-[#e5e5e5] dark:border-[#3a3a3a]
        focus:outline-none focus:border-[#3390ec]
        transition-colors
        ${className}
      `}
    >
      <option value={0}>{t('invoice.selectProduct')}</option>
      {products.map((product) => (
        <option key={product.id} value={product.id}>
          {product.name} {product.sku && `(${product.sku})`} - {product.selling_price.toLocaleString()} ETB
        </option>
      ))}
    </select>
  )
}

