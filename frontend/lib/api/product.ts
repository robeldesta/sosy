import { apiClient } from './client'

export interface Product {
  id: number
  business_id: number
  name: string
  sku?: string
  category?: string
  unit_of_measure: string
  buying_price: number
  selling_price: number
  low_stock_threshold?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateProduct {
  name: string
  sku?: string
  category?: string
  unit_of_measure: string
  buying_price: number
  selling_price: number
  low_stock_threshold?: number
  is_active?: boolean
}

export const productApi = {
  getProducts: async (): Promise<Product[]> => {
    const response = await apiClient.get('/products')
    return response.data
  },
  createProduct: async (data: CreateProduct): Promise<Product> => {
    const response = await apiClient.post('/products', data)
    return response.data
  },
}

