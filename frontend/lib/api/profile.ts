import { apiClient } from './client'

export interface UserProfile {
  id: number
  telegram_id: number
  first_name?: string
  last_name?: string
  username?: string
  phone?: string
  language?: string
  role?: string
  photo_url?: string
  created_at: string
  updated_at: string
}

export interface UpdateProfile {
  first_name?: string
  last_name?: string
  phone?: string
  language?: string
  role?: string
}

export const profileApi = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get('/profile')
    return response.data
  },
  updateProfile: async (data: UpdateProfile): Promise<UserProfile> => {
    const response = await apiClient.put('/profile', data)
    return response.data
  },
}

