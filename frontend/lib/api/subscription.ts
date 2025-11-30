import { apiClient } from './client'

export interface SubscriptionPlan {
  id: number
  code: string
  name: string
  description: string | null
  price_monthly: number
  price_yearly: number | null
  currency: string
  max_products: number | null
  max_invoices: number | null
  max_users: number
  max_branches: number
  features: Record<string, any> | null
  is_active: boolean
}

export interface UserSubscription {
  id: number
  user_id: number
  plan_code: string
  status: 'trial' | 'active' | 'expired' | 'cancelled' | 'payment_failed'
  started_at: string
  expires_at: string | null
  cancelled_at: string | null
  payment_provider: string | null
  transaction_reference: string | null
  last_payment_date: string | null
  next_billing_date: string | null
  billing_cycle: 'monthly' | 'yearly'
  auto_renew: boolean
}

export interface SubscriptionStatus {
  has_subscription: boolean
  status: string
  plan_code: string
  plan_name: string
  expires_at: string | null
  days_left: number | null
  is_trial: boolean
  can_upgrade: boolean
}

export interface PaymentTransaction {
  id: number
  user_id: number
  subscription_id: number | null
  amount: number
  currency: string
  payment_provider: string
  transaction_reference: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  payment_method: string | null
  payment_metadata: Record<string, any> | null
  created_at: string
  completed_at: string | null
}

export interface InitPaymentRequest {
  plan_code: string
  payment_provider: 'telebirr' | 'chapa' | 'paypal'
  billing_cycle?: 'monthly' | 'yearly'
}

export interface InitPaymentResponse {
  payment_url: string
  transaction_reference: string
  expires_at: string
}

export const subscriptionApi = {
  // Get all available subscription plans
  async getPlans(): Promise<SubscriptionPlan[]> {
    const response = await apiClient.get<SubscriptionPlan[]>('/subscription/plans')
    return response.data
  },

  // Get current subscription status
  async getStatus(): Promise<SubscriptionStatus> {
    const response = await apiClient.get<SubscriptionStatus>('/subscription/billing/status')
    return response.data
  },

  // Initialize payment for a subscription
  async initiatePayment(data: InitPaymentRequest): Promise<InitPaymentResponse> {
    const response = await apiClient.post<InitPaymentResponse>('/subscription/subscribe/init', data)
    return response.data
  },

  // Verify payment after completion
  async verifyPayment(transactionReference: string): Promise<UserSubscription> {
    const response = await apiClient.post<UserSubscription>('/subscription/subscribe/verify', {
      transaction_reference: transactionReference
    })
    return response.data
  },

  // Get billing history
  async getBillingHistory(): Promise<PaymentTransaction[]> {
    const response = await apiClient.get<PaymentTransaction[]>('/subscription/billing/history')
    return response.data
  },
}

