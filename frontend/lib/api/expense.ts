import { apiClient } from './client'

export interface ExpenseCategory {
  id: number
  business_id: number
  name: string
  description?: string
  created_at: string
}

export interface Expense {
  id: number
  business_id: number
  category_id?: number
  amount: number
  description: string
  expense_date: string
  payment_method: string // cash, telebirr, bank
  receipt_photo_url?: string
  notes?: string
  created_by?: number
  created_at: string
}

export interface ExpenseCreate {
  category_id?: number
  amount: number
  description: string
  expense_date?: string
  payment_method?: string
  receipt_photo_url?: string
  notes?: string
}

export interface ExpenseCategoryCreate {
  name: string
  description?: string
}

export const expenseApi = {
  getCategories: async (): Promise<ExpenseCategory[]> => {
    const response = await apiClient.get('/expense/categories')
    return response.data
  },

  createCategory: async (data: ExpenseCategoryCreate): Promise<ExpenseCategory> => {
    const response = await apiClient.post('/expense/categories', data)
    return response.data
  },

  getExpenses: async (): Promise<Expense[]> => {
    const response = await apiClient.get('/expense')
    return response.data
  },

  createExpense: async (data: ExpenseCreate): Promise<Expense> => {
    const response = await apiClient.post('/expense', data)
    return response.data
  },
}

