'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import { adminApi, Subscription, SubscriptionPlan } from '@/lib/api/admin'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramInput } from '@/components/telegram/TelegramInput'
import { TelegramButton } from '@/components/telegram/TelegramButton'
import { SkeletonCard } from '@/components/telegram/SkeletonCard'
import { EmptyState } from '@/components/telegram/EmptyState'
import { useToastStore } from '@/stores/toastStore'

export default function AdminSubscriptionsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { addToast } = useToastStore()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [planFilter, setPlanFilter] = useState<string>('')
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [showExtendModal, setShowExtendModal] = useState(false)
  const [extendDays, setExtendDays] = useState(30)

  useEffect(() => {
    loadSubscriptions()
    loadPlans()
  }, [statusFilter, planFilter])

  const loadSubscriptions = async () => {
    try {
      setLoading(true)
      const data = await adminApi.getSubscriptions(
        statusFilter || undefined,
        planFilter || undefined
      )
      setSubscriptions(data)
    } catch (error) {
      console.error('Failed to load subscriptions:', error)
      addToast('Failed to load subscriptions', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadPlans = async () => {
    try {
      const data = await adminApi.getPlans()
      setPlans(data)
    } catch (error) {
      console.error('Failed to load plans:', error)
    }
  }

  const handleExtend = async () => {
    if (!selectedSubscription) return

    try {
      await adminApi.extendSubscription(selectedSubscription.id, extendDays)
      addToast('Subscription extended successfully', 'success')
      setShowExtendModal(false)
      setSelectedSubscription(null)
      loadSubscriptions()
    } catch (error: any) {
      addToast(error.response?.data?.detail || 'Failed to extend subscription', 'error')
    }
  }

  const handleCancel = async (subscription: Subscription) => {
    if (!confirm(`Cancel subscription for user ${subscription.user_id}?`)) return

    try {
      await adminApi.cancelSubscription(subscription.id)
      addToast('Subscription cancelled', 'success')
      loadSubscriptions()
    } catch (error: any) {
      addToast(error.response?.data?.detail || 'Failed to cancel subscription', 'error')
    }
  }

  const handleActivate = async (subscription: Subscription) => {
    try {
      await adminApi.activateSubscription(subscription.id)
      addToast('Subscription activated', 'success')
      loadSubscriptions()
    } catch (error: any) {
      addToast(error.response?.data?.detail || 'Failed to activate subscription', 'error')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-[#34c759]'
      case 'trial':
        return 'text-[#007aff]'
      case 'expired':
        return 'text-[#ff3b30]'
      case 'cancelled':
        return 'text-[#8e8e93]'
      default:
        return 'text-[#707579]'
    }
  }

  const getPlanName = (planCode: string) => {
    const plan = plans.find((p) => p.code === planCode)
    return plan?.name || planCode
  }

  return (
    <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] pb-[80px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#212121] border-b border-[#e5e5e5] dark:border-[#3a3a3a]">
        <div className="px-[14px] py-[12px]">
          <h1 className="text-[20px] font-semibold leading-[24px]">Subscriptions</h1>
        </div>
      </div>

      {/* Filters */}
      <div className="p-[14px] space-y-[12px]">
        <div>
          <label className="text-[13px] text-[#707579] mb-[4px] block">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-[12px] py-[8px] bg-white dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#3a3a3a] rounded-[8px] text-[15px]"
          >
            <option value="">All Statuses</option>
            <option value="trial">Trial</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="text-[13px] text-[#707579] mb-[4px] block">Plan</label>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="w-full px-[12px] py-[8px] bg-white dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#3a3a3a] rounded-[8px] text-[15px]"
          >
            <option value="">All Plans</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.code}>
                {plan.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Subscription List */}
      <div className="px-[14px] space-y-[8px]">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : subscriptions.length === 0 ? (
          <EmptyState
            title="No subscriptions found"
            message={statusFilter || planFilter ? 'Try adjusting filters' : 'No subscriptions yet'}
          />
        ) : (
          subscriptions.map((subscription) => (
            <TelegramCard key={subscription.id}>
              <div className="p-[14px]">
                <div className="flex justify-between items-start mb-[8px]">
                  <div className="flex-1">
                    <div className="text-[17px] font-medium mb-[4px]">
                      User #{subscription.user_id}
                    </div>
                    <div className="text-[14px] text-[#707579] mb-[2px]">
                      {getPlanName(subscription.plan_code)}
                    </div>
                    <div className={`text-[13px] font-medium ${getStatusColor(subscription.status)}`}>
                      {subscription.status.toUpperCase()}
                    </div>
                  </div>
                  <div className="text-right">
                    {subscription.expires_at && (
                      <div className="text-[13px] text-[#707579]">
                        {new Date(subscription.expires_at).toLocaleDateString()}
                      </div>
                    )}
                    <div className="text-[12px] text-[#707579] mt-[2px]">
                      {subscription.billing_cycle}
                    </div>
                  </div>
                </div>

                {subscription.expires_at && (
                  <div className="text-[12px] text-[#707579] mb-[8px]">
                    Expires: {new Date(subscription.expires_at).toLocaleString()}
                  </div>
                )}

                <div className="flex gap-[8px] mt-[8px]">
                  {subscription.status === 'active' && (
                    <>
                      <TelegramButton
                        size="small"
                        onClick={() => {
                          setSelectedSubscription(subscription)
                          setShowExtendModal(true)
                        }}
                      >
                        Extend
                      </TelegramButton>
                      <TelegramButton
                        size="small"
                        variant="danger"
                        onClick={() => handleCancel(subscription)}
                      >
                        Cancel
                      </TelegramButton>
                    </>
                  )}
                  {subscription.status === 'expired' && (
                    <TelegramButton
                      size="small"
                      onClick={() => handleActivate(subscription)}
                    >
                      Activate
                    </TelegramButton>
                  )}
                  {subscription.status === 'cancelled' && (
                    <TelegramButton
                      size="small"
                      onClick={() => handleActivate(subscription)}
                    >
                      Reactivate
                    </TelegramButton>
                  )}
                  <TelegramButton
                    size="small"
                    variant="secondary"
                    onClick={() => router.push(`/admin/subscriptions/${subscription.id}`)}
                  >
                    View Details
                  </TelegramButton>
                </div>
              </div>
            </TelegramCard>
          ))
        )}
      </div>

      {/* Extend Modal */}
      {showExtendModal && selectedSubscription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[14px]">
          <TelegramCard className="w-full max-w-md">
            <div className="p-[14px]">
              <h2 className="text-[20px] font-semibold mb-[12px]">Extend Subscription</h2>
              <p className="text-[14px] text-[#707579] mb-[16px]">
                Extend subscription for User #{selectedSubscription.user_id}
              </p>

              <div className="mb-[16px]">
                <label className="text-[13px] text-[#707579] mb-[4px] block">Days</label>
                <TelegramInput
                  type="number"
                  value={extendDays.toString()}
                  onChange={(value) => setExtendDays(parseInt(value) || 30)}
                  min={1}
                  max={365}
                />
              </div>

              <div className="flex gap-[8px]">
                <TelegramButton
                  fullWidth
                  onClick={handleExtend}
                >
                  Extend
                </TelegramButton>
                <TelegramButton
                  fullWidth
                  variant="secondary"
                  onClick={() => {
                    setShowExtendModal(false)
                    setSelectedSubscription(null)
                  }}
                >
                  Cancel
                </TelegramButton>
              </div>
            </div>
          </TelegramCard>
        </div>
      )}
    </div>
  )
}

