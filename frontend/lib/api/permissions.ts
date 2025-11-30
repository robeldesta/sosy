import { apiClient } from './client'

export interface UserCapabilities {
  role: string
  can_view_cost_prices: boolean
  can_view_profit: boolean
  can_access_reports: boolean
  can_access_settings: boolean
  can_export_data: boolean
  can_manage_staff: boolean
  can_reconcile_cash: boolean
  can_adjust_stock: boolean
  show_sensitive_data: boolean
}

export const permissionsApi = {
  getCapabilities: async (): Promise<UserCapabilities> => {
    const response = await apiClient.get('/permissions/capabilities')
    return response.data
  },

  checkPermission: async (permission: string): Promise<boolean> => {
    const response = await apiClient.get(`/permissions/check/${permission}`)
    return response.data.has_permission
  },
}

