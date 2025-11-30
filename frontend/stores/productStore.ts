import { create } from 'zustand'
import { Product } from '@/lib/api/product'
import { StockItem } from '@/lib/api/inventory'
import { productApi } from '@/lib/api/product'
import { inventoryApi } from '@/lib/api/inventory'

interface ProductState {
  products: Product[]
  stockItems: StockItem[]
  loading: boolean
  error: string | null
  fetchProducts: () => Promise<void>
  fetchStock: (location?: string) => Promise<void>
  addProduct: (product: Product) => void
  updateStockItem: (stockItem: StockItem) => void
  clearError: () => void
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  stockItems: [],
  loading: false,
  error: null,

  fetchProducts: async () => {
    set({ loading: true, error: null })
    try {
      const products = await productApi.getProducts()
      set({ products, loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch products',
        loading: false 
      })
    }
  },

  fetchStock: async (location?: string) => {
    set({ loading: true, error: null })
    try {
      const stockItems = await inventoryApi.getStock(location)
      set({ stockItems, loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch stock',
        loading: false 
      })
    }
  },

  addProduct: (product: Product) => {
    set((state) => ({
      products: [...state.products, product]
    }))
  },

  updateStockItem: (stockItem: StockItem) => {
    set((state) => ({
      stockItems: state.stockItems.map((item) =>
        item.id === stockItem.id ? stockItem : item
      )
    }))
  },

  clearError: () => set({ error: null }),
}))

