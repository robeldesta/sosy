import { create } from 'zustand'
import { PurchaseItemCreate } from '@/lib/api/purchase'

export interface PurchaseDraftItem {
  product_id: number
  product_name?: string
  quantity: number
  unit_cost: number
  total: number
}

export interface PurchaseDraft {
  supplier_id: number
  supplier_name?: string
  date?: string
  notes?: string
  status?: string
  items: PurchaseDraftItem[]
}

interface PurchaseState {
  draft: PurchaseDraft
  setSupplier: (supplierId: number, supplierName?: string) => void
  setDate: (date: string) => void
  setNotes: (notes: string) => void
  addItem: (item: Omit<PurchaseDraftItem, 'total'>) => void
  updateItem: (index: number, updates: Partial<PurchaseDraftItem>) => void
  removeItem: (index: number) => void
  clearDraft: () => void
  calculateSubtotal: () => number
  calculateTax: () => number
  calculateTotal: () => number
}

const initialDraft: PurchaseDraft = {
  supplier_id: 0,
  items: [],
}

export const usePurchaseStore = create<PurchaseState>((set, get) => ({
  draft: initialDraft,

  setSupplier: (supplierId, supplierName) => {
    set((state) => ({
      draft: { ...state.draft, supplier_id: supplierId, supplier_name: supplierName },
    }))
  },

  setDate: (date) => {
    set((state) => ({
      draft: { ...state.draft, date },
    }))
  },

  setNotes: (notes) => {
    set((state) => ({
      draft: { ...state.draft, notes },
    }))
  },

  addItem: (item) => {
    const total = item.quantity * item.unit_cost
    set((state) => ({
      draft: {
        ...state.draft,
        items: [...state.draft.items, { ...item, total }],
      },
    }))
  },

  updateItem: (index, updates) => {
    set((state) => {
      const newItems = [...state.draft.items]
      const item = { ...newItems[index], ...updates }
      item.total = item.quantity * item.unit_cost
      newItems[index] = item
      return {
        draft: { ...state.draft, items: newItems },
      }
    })
  },

  removeItem: (index) => {
    set((state) => ({
      draft: {
        ...state.draft,
        items: state.draft.items.filter((_, i) => i !== index),
      },
    }))
  },

  clearDraft: () => {
    set({ draft: initialDraft })
  },

  calculateSubtotal: () => {
    return get().draft.items.reduce((sum, item) => sum + item.total, 0)
  },

  calculateTax: () => {
    return get().calculateSubtotal() * 0.15 // 15% VAT for Ethiopia
  },

  calculateTotal: () => {
    return get().calculateSubtotal() + get().calculateTax()
  },
}))


