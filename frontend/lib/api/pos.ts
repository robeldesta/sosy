import { apiClient } from './client'

export interface POSProduct {
  id: number
  name: string
  price: number
  stock: number
  sku?: string
  barcode?: string
  unit?: string
}

export interface CartItem {
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
  stock_available: number
}

export interface CheckoutRequest {
  items: Array<{
    product_id: number
    quantity: number
    unit_price: number
  }>
  payment_method: 'cash' | 'mobile_money' | 'card' | 'credit'
  customer_name?: string
  customer_phone?: string
  discount?: number
  notes?: string
}

export interface CheckoutResponse {
  success: boolean
  sale_id: number
  invoice_id?: number
  invoice_number?: string
  total: number
  payment_method: string
}

export interface POSSession {
  id: number
  opened_at: string
  total_sales: number
  total_transactions: number
  cash_total: number
  mobile_money_total: number
  card_total: number
  credit_total: number
  is_active: boolean
}

export const posApi = {
  // Search products
  async searchProducts(query: string, limit: number = 20): Promise<POSProduct[]> {
    const response = await apiClient.get<POSProduct[]>('/pos/search', {
      params: { q: query, limit }
    })
    return response.data
  },

  // Validate cart
  async validateCart(items: Array<{ product_id: number; quantity: number; unit_price: number }>) {
    const response = await apiClient.post('/pos/cart/validate', { items })
    return response.data
  },

  // Checkout
  async checkout(data: CheckoutRequest): Promise<CheckoutResponse> {
    const response = await apiClient.post<CheckoutResponse>('/pos/checkout', data)
    return response.data
  },

  // Get POS session
  async getSession(): Promise<POSSession> {
    const response = await apiClient.get<POSSession>('/pos/session')
    return response.data
  },

  // Close session
  async closeSession() {
    const response = await apiClient.post('/pos/session/close')
    return response.data
  },
}

