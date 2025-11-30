import { apiClient } from './client'

export interface Supplier {
  id: number
  business_id: number
  name: string
  phone?: string
  address?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface SupplierCreate {
  name: string
  phone?: string
  address?: string
  notes?: string
}

export const supplierApi = {
  async getSuppliers(): Promise<Supplier[]> {
    const response = await apiClient.get('/suppliers')
    return response.data
  },

  async getSupplier(id: number): Promise<Supplier> {
    const response = await apiClient.get(`/suppliers/${id}`)
    return response.data
  },

  async createSupplier(data: SupplierCreate): Promise<Supplier> {
    const response = await apiClient.post('/suppliers', data)
    return response.data
  },

  async updateSupplier(id: number, data: Partial<SupplierCreate>): Promise<Supplier> {
    const response = await apiClient.put(`/suppliers/${id}`, data)
    return response.data
  },

  async deleteSupplier(id: number): Promise<void> {
    await apiClient.delete(`/suppliers/${id}`)
  },
}


