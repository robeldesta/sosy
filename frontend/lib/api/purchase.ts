import { apiClient } from './client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface PurchaseItem {
  id: number
  purchase_id: number
  product_id: number
  quantity: number
  unit_cost: number
  total: number
  product?: {
    id: number
    name: string
  }
}

export interface Purchase {
  id: number
  business_id: number
  supplier_id: number
  purchase_number: string
  date: string
  subtotal: number
  tax: number
  total: number
  status: string
  notes?: string
  created_at: string
  updated_at: string
  items?: PurchaseItem[]
  supplier?: {
    id: number
    name: string
    phone?: string
    address?: string
  }
}

export interface PurchaseItemCreate {
  product_id: number
  quantity: number
  unit_cost: number
}

export interface PurchaseCreate {
  supplier_id: number
  date?: string
  notes?: string
  status?: string
  items: PurchaseItemCreate[]
}

export const purchaseApi = {
  async getPurchases(): Promise<Purchase[]> {
    const response = await apiClient.get('/purchase')
    return response.data
  },

  async getPurchase(id: number): Promise<Purchase> {
    const response = await apiClient.get(`/purchase/${id}`)
    return response.data
  },

  async createPurchase(data: PurchaseCreate): Promise<Purchase> {
    const response = await apiClient.post('/purchase', data)
    return response.data
  },

  async markAsReceived(id: number): Promise<Purchase> {
    const response = await apiClient.post(`/purchase/${id}/receive`)
    return response.data
  },

  getPdfUrl(id: number): string {
    return `${API_URL}/purchase/${id}/pdf`
  },
}


