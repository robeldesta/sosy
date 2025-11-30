import { create } from 'zustand'

export interface InvoiceItem {
  product_id: number
  product_name?: string
  quantity: number
  unit_price: number
  total: number
}

export interface InvoiceDraft {
  customer_name: string
  customer_phone: string
  items: InvoiceItem[]
}

interface InvoiceState {
  draft: InvoiceDraft
  setCustomerName: (name: string) => void
  setCustomerPhone: (phone: string) => void
  addItem: (item: Omit<InvoiceItem, 'total'>) => void
  updateItem: (index: number, updates: Partial<InvoiceItem>) => void
  removeItem: (index: number) => void
  clearDraft: () => void
  calculateSubtotal: () => number
  calculateTax: () => number
  calculateTotal: () => number
}

const initialDraft: InvoiceDraft = {
  customer_name: '',
  customer_phone: '',
  items: [],
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  draft: initialDraft,

  setCustomerName: (name: string) => {
    set((state) => ({
      draft: { ...state.draft, customer_name: name },
    }))
  },

  setCustomerPhone: (phone: string) => {
    set((state) => ({
      draft: { ...state.draft, customer_phone: phone },
    }))
  },

  addItem: (item: Omit<InvoiceItem, 'total'>) => {
    const total = item.quantity * item.unit_price
    set((state) => ({
      draft: {
        ...state.draft,
        items: [...state.draft.items, { ...item, total }],
      },
    }))
  },

  updateItem: (index: number, updates: Partial<InvoiceItem>) => {
    set((state) => {
      const newItems = [...state.draft.items]
      const item = { ...newItems[index], ...updates }
      item.total = item.quantity * item.unit_price
      newItems[index] = item
      return {
        draft: { ...state.draft, items: newItems },
      }
    })
  },

  removeItem: (index: number) => {
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

