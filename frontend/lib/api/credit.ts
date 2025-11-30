import { apiClient } from './client'

export interface CreditInvoice {
  invoice_id: number
  invoice_number: string
  customer_name?: string
  customer_phone?: string
  total: number
  outstanding: number
  days_old: number
  created_at: string
}

export interface CreditSummary {
  total_outstanding: number
  invoice_count: number
  invoices: CreditInvoice[]
  aging_buckets: {
    '0-30': CreditInvoice[]
    '31-60': CreditInvoice[]
    '60+': CreditInvoice[]
  }
}

export interface CustomerCredit {
  customer_name?: string
  customer_phone: string
  total_outstanding: number
  invoice_count: number
  invoices: Array<{
    invoice_id: number
    invoice_number: string
    outstanding: number
    created_at: string
  }>
}

export const creditApi = {
  getCustomerCredit: async (customerPhone?: string): Promise<CreditSummary> => {
    const params = customerPhone ? { customer_phone: customerPhone } : {}
    const response = await apiClient.get('/credit/customer', { params })
    return response.data
  },

  getAllCustomersCredit: async (): Promise<CustomerCredit[]> => {
    const response = await apiClient.get('/credit/customers')
    return response.data
  },
}

