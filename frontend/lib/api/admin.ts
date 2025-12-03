import { apiClient } from './client'

export interface Business {
  id: number
  name: string
  business_type?: string
  location?: string
  currency: string
  tax_type?: string
  created_at: string
  updated_at: string
}

export interface SystemStats {
  total_businesses: number
  active_users_today: number
  invoices_24h: number
  sync_errors_24h: number
  mrr: number
  arr: number
}

export interface BusinessMetrics {
  id: number
  business_id: number
  metric_date: string
  total_sales: number
  total_invoices: number
  total_revenue: number
  total_expenses: number
  profit: number
  customers_count: number
  stock_value: number
}

export interface Subscription {
  id: number
  user_id: number
  plan_code: string
  status: string
  started_at: string
  expires_at?: string
  cancelled_at?: string
  payment_provider?: string
  transaction_reference?: string
  last_payment_date?: string
  next_billing_date?: string
  billing_cycle: string
  auto_renew: boolean
  created_at: string
  updated_at: string
}

export interface PaymentTransaction {
  id: number
  user_id: number
  subscription_id?: number
  amount: number
  currency: string
  payment_provider: string
  transaction_reference: string
  status: string
  payment_method?: string
  created_at: string
  completed_at?: string
}

export interface SubscriptionPlan {
  id: number
  code: string
  name: string
  description?: string
  price_monthly: number
  price_yearly?: number
  currency: string
  max_products?: number
  max_invoices?: number
  max_users: number
  max_branches: number
  is_active: boolean
}

export const adminApi = {
  // Get system stats
  async getStats(): Promise<SystemStats> {
    const response = await apiClient.get<SystemStats>('/admin/stats/dashboard')
    return response.data
  },

  // List businesses
  async getBusinesses(search?: string, limit?: number): Promise<Business[]> {
    const response = await apiClient.get<Business[]>('/admin/businesses', {
      params: { search, limit },
    })
    return response.data
  },

  // Get business details
  async getBusiness(id: number): Promise<Business> {
    const response = await apiClient.get<Business>(`/admin/businesses/${id}`)
    return response.data
  },

  // Suspend business
  async suspendBusiness(id: number, reason?: string): Promise<{ success: boolean; business: Business }> {
    const response = await apiClient.post<{ success: boolean; business: Business }>(
      `/admin/businesses/${id}/suspend`,
      { reason }
    )
    return response.data
  },

  // Upgrade business plan
  async upgradePlan(id: number, plan: string, months: number): Promise<{ success: boolean; business: Business }> {
    const response = await apiClient.post<{ success: boolean; business: Business }>(
      `/admin/businesses/${id}/upgrade`,
      { plan, months }
    )
    return response.data
  },

  // Get business metrics
  async getBusinessMetrics(id: number, days: number = 30): Promise<BusinessMetrics[]> {
    const response = await apiClient.get<BusinessMetrics[]>(`/admin/businesses/${id}/metrics`, {
      params: { days },
    })
    return response.data
  },

  // Subscription Management
  async getSubscriptions(status?: string, plan_code?: string, limit?: number): Promise<Subscription[]> {
    const response = await apiClient.get<Subscription[]>('/admin/subscriptions', {
      params: { status, plan_code, limit },
    })
    return response.data
  },

  async getSubscription(id: number): Promise<Subscription> {
    const response = await apiClient.get<Subscription>(`/admin/subscriptions/${id}`)
    return response.data
  },

  async extendSubscription(id: number, days: number): Promise<{ success: boolean; subscription: Subscription }> {
    const response = await apiClient.post<{ success: boolean; subscription: Subscription }>(
      `/admin/subscriptions/${id}/extend`,
      { days }
    )
    return response.data
  },

  async cancelSubscription(id: number): Promise<{ success: boolean; subscription: Subscription }> {
    const response = await apiClient.post<{ success: boolean; subscription: Subscription }>(
      `/admin/subscriptions/${id}/cancel`
    )
    return response.data
  },

  async activateSubscription(id: number): Promise<{ success: boolean; subscription: Subscription }> {
    const response = await apiClient.post<{ success: boolean; subscription: Subscription }>(
      `/admin/subscriptions/${id}/activate`
    )
    return response.data
  },

  async getSubscriptionPayments(id: number): Promise<PaymentTransaction[]> {
    const response = await apiClient.get<PaymentTransaction[]>(`/admin/subscriptions/${id}/payments`)
    return response.data
  },

  async getPlans(): Promise<SubscriptionPlan[]> {
    const response = await apiClient.get<SubscriptionPlan[]>('/admin/subscriptions/plans')
    return response.data
  },
}

