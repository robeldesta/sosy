import { apiClient } from './client'

export interface Invite {
  id: number
  code: string
  role: string
  branch_id?: number
  expires_at: string
  is_active: boolean
  used_by?: number
  used_at?: string
  created_at: string
}

export interface InviteCreate {
  role: string
  branch_id?: number
  expires_in_hours?: number
}

export const inviteApi = {
  createInvite: async (data: InviteCreate): Promise<Invite> => {
    const response = await apiClient.post('/invite', data)
    return response.data
  },

  listInvites: async (activeOnly: boolean = true): Promise<Invite[]> => {
    const response = await apiClient.get('/invite', { params: { active_only: activeOnly } })
    return response.data
  },

  validateInvite: async (code: string): Promise<{ valid: boolean; role: string; expires_at: string }> => {
    const response = await apiClient.get(`/invite/validate/${code}`)
    return response.data
  },

  useInvite: async (code: string, telegramId: number, userData: {
    first_name?: string
    last_name?: string
    username?: string
    photo_url?: string
  }): Promise<{ success: boolean; user_id: number; role: string; business_id: number }> => {
    const response = await apiClient.post(`/invite/use/${code}`, {
      telegram_id: telegramId,
      ...userData,
    })
    return response.data
  },
}

