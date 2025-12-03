import { apiClient } from './client'

export interface Customer {
  id: number
  business_id: number
  branch_id?: number
  name: string
  phone?: string
  telegram_user_id?: number
  email?: string
  address?: string
  notes?: string
  total_credit: number
  total_paid: number
  balance: number
  loyalty_points: number
  is_active: boolean
  is_settled: boolean
  created_at: string
  updated_at: string
  last_payment_at?: string
  last_sale_at?: string
}

export interface CustomerCreate {
  name: string
  phone?: string
  telegram_user_id?: number
  email?: string
  address?: string
  notes?: string
}

export interface CustomerUpdate {
  name?: string
  phone?: string
  telegram_user_id?: number
  email?: string
  address?: string
  notes?: string
}

export interface CreditEntry {
  id: number
  customer_id: number
  entry_type: 'credit' | 'payment'
  amount: number
  balance_after: number
  payment_method?: string
  reference?: string
  notes?: string
  created_at: string
}

export interface PaymentEntryCreate {
  customer_id: number
  amount: number
  payment_method: string
  reference?: string
  notes?: string
}

export interface CreditEntryCreate {
  customer_id: number
  amount: number
  sale_id?: number
  invoice_id?: number
  reference?: string
  notes?: string
}

export interface CustomerLedger {
  customer: Customer
  entries: CreditEntry[]
  current_balance: number
}

export interface AgingBucket {
  bucket: string
  count: number
  total_amount: number
  customers: Customer[]
}

export interface AgingReport {
  total_outstanding: number
  buckets: AgingBucket[]
}

export interface LoyaltyEntry {
  id: number
  customer_id: number
  entry_type: 'earned' | 'redeemed'
  points: number
  points_after: number
  redemption_type?: string
  redemption_value?: number
  notes?: string
  created_at: string
}

export const customersApi = {
  // List customers
  async getCustomers(search?: string): Promise<Customer[]> {
    const response = await apiClient.get<Customer[]>('/customers', {
      params: search ? { search } : {},
    })
    return response.data
  },

  // Get customer by ID
  async getCustomer(id: number): Promise<Customer> {
    const response = await apiClient.get<Customer>(`/customers/${id}`)
    return response.data
  },

  // Create customer
  async createCustomer(data: CustomerCreate): Promise<Customer> {
    const response = await apiClient.post<Customer>('/customers', data)
    return response.data
  },

  // Update customer
  async updateCustomer(id: number, data: CustomerUpdate): Promise<Customer> {
    const response = await apiClient.put<Customer>(`/customers/${id}`, data)
    return response.data
  },

  // Delete customer (soft delete)
  async deleteCustomer(id: number): Promise<void> {
    await apiClient.delete(`/customers/${id}`)
  },

  // Add credit entry
  async addCredit(data: CreditEntryCreate): Promise<CreditEntry> {
    const response = await apiClient.post<CreditEntry>('/customers/credit/add', data)
    return response.data
  },

  // Record payment
  async addPayment(data: PaymentEntryCreate): Promise<CreditEntry> {
    const response = await apiClient.post<CreditEntry>('/customers/payment/add', data)
    return response.data
  },

  // Get customer ledger
  async getLedger(customerId: number, limit?: number): Promise<CustomerLedger> {
    const response = await apiClient.get<CustomerLedger>(`/customers/${customerId}/ledger`, {
      params: limit ? { limit } : {},
    })
    return response.data
  },

  // Get aging report
  async getAgingReport(): Promise<AgingReport> {
    const response = await apiClient.get<AgingReport>('/credit/aging')
    return response.data
  },

  // Get customer loyalty history
  async getLoyaltyHistory(customerId: number, limit?: number): Promise<LoyaltyEntry[]> {
    const response = await apiClient.get<LoyaltyEntry[]>(`/customers/${customerId}/loyalty`, {
      params: limit ? { limit } : {},
    })
    return response.data
  },
}

