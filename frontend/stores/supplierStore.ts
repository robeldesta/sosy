import { create } from 'zustand'
import { supplierApi, Supplier } from '@/lib/api/supplier'

interface SupplierState {
  suppliers: Supplier[]
  loading: boolean
  fetchSuppliers: () => Promise<void>
  addSupplier: (supplier: Supplier) => void
  updateSupplier: (id: number, supplier: Supplier) => void
  removeSupplier: (id: number) => void
}

export const useSupplierStore = create<SupplierState>((set) => ({
  suppliers: [],
  loading: false,

  fetchSuppliers: async () => {
    set({ loading: true })
    try {
      const suppliers = await supplierApi.getSuppliers()
      set({ suppliers, loading: false })
    } catch (error) {
      console.error('Failed to fetch suppliers:', error)
      set({ loading: false })
    }
  },

  addSupplier: (supplier) => {
    set((state) => ({
      suppliers: [...state.suppliers, supplier],
    }))
  },

  updateSupplier: (id, supplier) => {
    set((state) => ({
      suppliers: state.suppliers.map((s) => (s.id === id ? supplier : s)),
    }))
  },

  removeSupplier: (id) => {
    set((state) => ({
      suppliers: state.suppliers.filter((s) => s.id !== id),
    }))
  },
}))


