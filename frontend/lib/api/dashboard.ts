import { apiClient } from './client'

export interface LowStockProduct {
  product_id: number
  product_name: string
  current_stock: number
  reorder_point: number
  unit_of_measure: string
}

export interface TopProduct {
  product_id: number
  product_name: string
  quantity_sold: number
  revenue: number
}

export interface ActivityLog {
  id: number
  timestamp: string
  action_type: string
  description: string
  metadata: Record<string, any>
}

export interface DashboardData {
  today_sales: number
  today_purchases: number
  low_stock: LowStockProduct[]
  top_products_7_days: TopProduct[]
  recent_activity: ActivityLog[]
}

export interface DailySummary {
  date: string
  sales: number
  purchases: number
  top_products: TopProduct[]
  low_stock_count: number
}

export const dashboardApi = {
  getDashboard: async (): Promise<DashboardData> => {
    const response = await apiClient.get('/dashboard')
    return response.data
  },

  getDailySummary: async (date?: string): Promise<DailySummary> => {
    const params = date ? { date } : {}
    const response = await apiClient.get('/dashboard/summary/daily', { params })
    return response.data
  },
}

