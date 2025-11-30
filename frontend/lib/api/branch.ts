import { apiClient } from './client'

export interface Branch {
  id: number
  business_id: number
  name: string
  location?: string
  address?: string
  phone?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BranchCreate {
  name: string
  location?: string
  address?: string
  phone?: string
}

export const branchApi = {
  listBranches: async (): Promise<Branch[]> => {
    const response = await apiClient.get('/branch')
    return response.data
  },

  createBranch: async (data: BranchCreate): Promise<Branch> => {
    const response = await apiClient.post('/branch', data)
    return response.data
  },

  updateBranch: async (branchId: number, data: BranchCreate): Promise<Branch> => {
    const response = await apiClient.put(`/branch/${branchId}`, data)
    return response.data
  },

  deleteBranch: async (branchId: number): Promise<void> => {
    await apiClient.delete(`/branch/${branchId}`)
  },
}

