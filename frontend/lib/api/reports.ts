import { apiClient } from './client'

export interface DailySalesReport {
  date: string
  total_sales: number
  total_invoices: number
  invoices: Array<{
    id: number
    number: string
    total: number
  }>
}

export interface WeeklySummary {
  period: string
  total_sales: number
  total_expenses: number
  net: number
}

export interface MonthlyOverview {
  month: number
  year: number
  total_sales: number
  total_expenses: number
  profit_estimate: number
}

export interface ExpenseByCategory {
  category_id?: number
  category_name: string
  total: number
}

export interface CreditAging {
  total_outstanding: number
  aging_buckets: {
    '0-30': any[]
    '31-60': any[]
    '60+': any[]
  }
}

export const reportsApi = {
  getDailySales: async (date?: string): Promise<DailySalesReport> => {
    const params = date ? { date } : {}
    const response = await apiClient.get('/reports/daily-sales', { params })
    return response.data
  },

  getWeeklySummary: async (): Promise<WeeklySummary> => {
    const response = await apiClient.get('/reports/weekly-summary')
    return response.data
  },

  getMonthlyOverview: async (month?: number, year?: number): Promise<MonthlyOverview> => {
    const params: any = {}
    if (month) params.month = month
    if (year) params.year = year
    const response = await apiClient.get('/reports/monthly-overview', { params })
    return response.data
  },

  getExpensesByCategory: async (startDate?: string, endDate?: string): Promise<ExpenseByCategory[]> => {
    const params: any = {}
    if (startDate) params.start_date = startDate
    if (endDate) params.end_date = endDate
    const response = await apiClient.get('/reports/expenses-by-category', { params })
    return response.data
  },

  getCreditAging: async (): Promise<CreditAging> => {
    const response = await apiClient.get('/reports/credit-aging')
    return response.data
  },
}

