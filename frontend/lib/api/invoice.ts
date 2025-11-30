import { apiClient } from './client'

export interface InvoiceItem {
  id: number
  invoice_id: number
  stock_item_id: number
  quantity: number
  unit_price: number
  total: number
}

export interface Invoice {
  id: number
  invoice_number: string
  customer_name?: string
  customer_phone?: string
  items?: InvoiceItem[]
  subtotal: number
  discount?: number
  tax: number
  total: number
  status: string
  payment_mode?: string
  template?: string
  created_at: string
  updated_at?: string
}

export interface CreateInvoice {
  customer_name?: string
  customer_phone?: string
  items: {
    stock_item_id: number
    quantity: number
    unit_price: number
  }[]
  discount?: number
  payment_mode?: string // cash, credit
  template?: string // simple, modern, blue
}

export const invoiceApi = {
  getInvoices: async (): Promise<Invoice[]> => {
    const response = await apiClient.get('/invoice')
    return response.data
  },
  getInvoice: async (id: number): Promise<Invoice> => {
    const response = await apiClient.get(`/invoice/${id}`)
    return response.data
  },
  createInvoice: async (data: CreateInvoice): Promise<Invoice> => {
    const response = await apiClient.post('/invoice', data)
    return response.data
  },
  markAsPaid: async (id: number): Promise<Invoice> => {
    const response = await apiClient.post(`/invoice/${id}/pay`)
    return response.data
  },
}
