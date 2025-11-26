import { apiClient } from './client'

export interface Business {
  id: number
  name: string
  tax_id?: string
  address?: string
  phone?: string
  email?: string
  created_at: string
  updated_at: string
}

export interface UpdateBusiness {
  name?: string
  tax_id?: string
  address?: string
  phone?: string
  email?: string
}

export const businessApi = {
  getBusiness: async (): Promise<Business> => {
    const response = await apiClient.get('/business')
    return response.data
  },
  updateBusiness: async (data: UpdateBusiness): Promise<Business> => {
    const response = await apiClient.put('/business', data)
    return response.data
  },
}

