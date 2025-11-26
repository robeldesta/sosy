import { apiClient } from './client'

export interface TelegramLoginData {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: {
    id: number
    telegram_id: number
    first_name?: string
    last_name?: string
    username?: string
    photo_url?: string
  }
}

export const authApi = {
  telegramLogin: async (data: TelegramLoginData): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/telegram-login', data)
    return response.data
  },
}

