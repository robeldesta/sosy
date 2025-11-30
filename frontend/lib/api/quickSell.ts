import { apiClient } from './client'
import type { Invoice } from './invoice'

export interface QuickSellRequest {
  product_id: number
  quantity: number
  customer_name?: string
}

export const quickSellApi = {
  quickSell: async (data: QuickSellRequest): Promise<Invoice> => {
    const response = await apiClient.post('/quick_sell', data)
    return response.data
  },
}

