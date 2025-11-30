import { apiClient } from './client'

export interface StockItem {
  id: number
  product_id: number
  quantity: number
  location: string
  last_updated: string
  product_name: string
  product_sku?: string
  unit_of_measure: string
}

export interface InventoryMovement {
  id: number
  product_id: number
  movement_type: string
  quantity: number
  reference?: string
  created_at: string
  user_id?: number
}

export interface CreateMovement {
  product_id: number
  movement_type: string
  quantity: number
  reference?: string
}

export const inventoryApi = {
  getStock: async (location?: string): Promise<StockItem[]> => {
    const params = location ? { location } : {}
    const response = await apiClient.get('/stock', { params })
    return response.data
  },
  createMovement: async (data: CreateMovement): Promise<InventoryMovement> => {
    const response = await apiClient.post('/stock/movement', data)
    return response.data
  },
}

