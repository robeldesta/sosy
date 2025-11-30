import { apiClient } from './client'

export interface CashbookEntry {
  id: number
  business_id: number
  entry_type: string // payment_in, expense_out, adjustment
  amount: number
  payment_method?: string
  reference_id?: number
  reference_type?: string
  description: string
  entry_date: string
  created_by?: number
  created_at: string
}

export interface CashbookSummary {
  date: string
  cash_in: number
  cash_out: number
  net_cash: number
  cash_by_method: {
    cash: number
    telebirr: number
    bank: number
    other: number
  }
  entries: CashbookEntry[]
}

export interface CashReconciliation {
  id: number
  business_id: number
  reconciliation_date: string
  expected_cash: number
  actual_cash: number
  difference: number
  adjustment_amount: number
  adjustment_reason?: string
  notes?: string
  reconciled_by?: number
  created_at: string
}

export interface CashReconciliationCreate {
  reconciliation_date?: string
  actual_cash: number
  adjustment_reason?: string
  notes?: string
}

export const cashbookApi = {
  getSummary: async (date?: string, period: 'day' | 'week' | 'month' = 'day'): Promise<CashbookSummary> => {
    const params: any = { period }
    if (date) params.date = date
    const response = await apiClient.get('/cashbook/summary', { params })
    return response.data
  },

  reconcile: async (data: CashReconciliationCreate): Promise<CashReconciliation> => {
    const response = await apiClient.post('/cashbook/reconcile', data)
    return response.data
  },
}

