import { apiClient } from './client'

export interface StockItem {
  id: number
  name: string
  description?: string
  quantity: number
  unit_price: number
  category?: string
  created_at: string
  updated_at: string
}

export interface CreateStockItem {
  name: string
  description?: string
  quantity: number
  unit_price: number
  category?: string
}

export const stockApi = {
  getStock: async (): Promise<StockItem[]> => {
    const response = await apiClient.get('/stock')
    return response.data
  },
  createStock: async (data: CreateStockItem): Promise<StockItem> => {
    const response = await apiClient.post('/stock', data)
    return response.data
  },
}

