import { apiClient } from './client'

export interface ActivityLog {
  id: number
  business_id: number
  user_id?: number
  timestamp: string
  action_type: string
  entity_type?: string
  entity_id?: number
  description: string
  user_name?: string
  meta_data?: Record<string, any>
}

export const activityApi = {
  getActivity: async (limit: number = 50): Promise<ActivityLog[]> => {
    const response = await apiClient.get('/activity', { params: { limit } })
    return response.data
  },
}

