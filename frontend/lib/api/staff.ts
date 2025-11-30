import { apiClient } from './client'

export interface StaffMember {
  id: number
  telegram_id: number
  first_name?: string
  last_name?: string
  username?: string
  role: string
  branch_id?: number
  last_login_at?: string
  created_at: string
}

export interface StaffInsight {
  user_id: number
  user_name: string
  role: string
  total_sales: number
  invoice_count: number
  cancelled_invoices: number
  payments_collected: number
  avg_invoice: number
}

export const staffApi = {
  listStaff: async (): Promise<StaffMember[]> => {
    const response = await apiClient.get('/staff')
    return response.data
  },

  removeStaff: async (userId: number): Promise<void> => {
    await apiClient.delete(`/staff/${userId}`)
  },

  getInsights: async (startDate?: string, endDate?: string): Promise<StaffInsight[]> => {
    const params: any = {}
    if (startDate) params.start_date = startDate
    if (endDate) params.end_date = endDate
    const response = await apiClient.get('/staff/insights', { params })
    return response.data
  },
}

