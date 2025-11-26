import { create } from 'zustand'

interface Business {
  id: number
  name: string
  taxId?: string
  address?: string
  phone?: string
  email?: string
  createdAt: string
  updatedAt: string
}

interface BusinessState {
  business: Business | null
  setBusiness: (business: Business | null) => void
  updateBusiness: (updates: Partial<Business>) => void
}

export const useBusinessStore = create<BusinessState>((set) => ({
  business: null,
  setBusiness: (business) => set({ business }),
  updateBusiness: (updates) =>
    set((state) => ({
      business: state.business ? { ...state.business, ...updates } : null,
    })),
}))

