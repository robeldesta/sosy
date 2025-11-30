import { apiClient } from './client'
import { TopProduct } from './dashboard'

export interface AnalyticsData {
  today_sales: number
  week_sales: number
  month_sales: number
  low_stock_count: number
  top_items: TopProduct[]
}

export const analyticsApi = {
  getAnalytics: async (): Promise<AnalyticsData> => {
    const response = await apiClient.get('/analytics')
    return response.data
  },
}

