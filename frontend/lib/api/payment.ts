import { apiClient } from './client'

export interface Payment {
  id: number
  invoice_id: number
  amount: number
  payment_method: string // cash, telebirr, bank, other
  bank_name?: string
  payment_date: string
  notes?: string
  created_by?: number
  created_at: string
}

export interface PaymentCreate {
  invoice_id: number
  amount: number
  payment_method: string
  bank_name?: string
  payment_date?: string
  notes?: string
}

export interface PaymentSummary {
  invoice_id: number
  invoice_total: number
  total_paid: number
  outstanding_balance: number
  status: string
}

export const paymentApi = {
  createPayment: async (data: PaymentCreate): Promise<Payment> => {
    const response = await apiClient.post('/payment', data)
    return response.data
  },

  getInvoicePayments: async (invoiceId: number): Promise<Payment[]> => {
    const response = await apiClient.get(`/payment/invoice/${invoiceId}`)
    return response.data
  },

  getInvoicePaymentSummary: async (invoiceId: number): Promise<PaymentSummary> => {
    const response = await apiClient.get(`/payment/invoice/${invoiceId}/total`)
    return response.data
  },
}

