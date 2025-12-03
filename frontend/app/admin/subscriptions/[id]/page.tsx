'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useRouter } from 'next/navigation'
import { adminApi, Subscription, PaymentTransaction } from '@/lib/api/admin'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramButton } from '@/components/telegram/TelegramButton'
import { BackButton } from '@/components/telegram/BackButton'
import { useBackButton } from '@/hooks/useBackButton'
import { useToastStore } from '@/stores/toastStore'
import { SkeletonCard } from '@/components/telegram/SkeletonCard'

export default function AdminSubscriptionDetailPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const params = useParams()
  const subscriptionId = parseInt(params.id as string)
  const { addToast } = useToastStore()

  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [payments, setPayments] = useState<PaymentTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useBackButton()

  useEffect(() => {
    if (subscriptionId) {
      loadSubscription()
      loadPayments()
    }
  }, [subscriptionId])

  const loadSubscription = async () => {
    try {
      setLoading(true)
      const data = await adminApi.getSubscription(subscriptionId)
      setSubscription(data)
    } catch (error) {
      console.error('Failed to load subscription:', error)
      addToast('Failed to load subscription', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadPayments = async () => {
    try {
      const data = await adminApi.getSubscriptionPayments(subscriptionId)
      setPayments(data)
    } catch (error) {
      console.error('Failed to load payments:', error)
    }
  }

  const handleExtend = async () => {
    const days = prompt('Enter number of days to extend:', '30')
    if (!days || !subscription) return

    try {
      await adminApi.extendSubscription(subscription.id, parseInt(days))
      addToast('Subscription extended', 'success')
      loadSubscription()
    } catch (error: any) {
      addToast(error.response?.data?.detail || 'Failed to extend subscription', 'error')
    }
  }

  const handleCancel = async () => {
    if (!subscription || !confirm('Cancel this subscription?')) return

    try {
      await adminApi.cancelSubscription(subscription.id)
      addToast('Subscription cancelled', 'success')
      loadSubscription()
    } catch (error: any) {
      addToast(error.response?.data?.detail || 'Failed to cancel subscription', 'error')
    }
  }

  const handleActivate = async () => {
    if (!subscription) return

    try {
      await adminApi.activateSubscription(subscription.id)
      addToast('Subscription activated', 'success')
      loadSubscription()
    } catch (error: any) {
      addToast(error.response?.data?.detail || 'Failed to activate subscription', 'error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] p-[14px]">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] flex items-center justify-center p-[14px]">
        <div className="text-[#707579] text-[15px]">Subscription not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] pb-[80px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#212121] border-b border-[#e5e5e5] dark:border-[#3a3a3a]">
        <div className="px-[14px] py-[12px] flex items-center gap-[12px]">
          <BackButton />
          <h1 className="text-[20px] font-semibold leading-[24px]">Subscription Details</h1>
        </div>
      </div>

      <div className="p-[14px] space-y-[12px]">
        {/* Subscription Info */}
        <TelegramCard>
          <div className="p-[14px] space-y-[12px]">
            <div>
              <div className="text-[13px] text-[#707579] mb-[4px]">User ID</div>
              <div className="text-[17px] font-medium">#{subscription.user_id}</div>
            </div>

            <div>
              <div className="text-[13px] text-[#707579] mb-[4px]">Plan</div>
              <div className="text-[17px] font-medium">{subscription.plan_code}</div>
            </div>

            <div>
              <div className="text-[13px] text-[#707579] mb-[4px]">Status</div>
              <div className={`text-[17px] font-medium ${
                subscription.status === 'active' ? 'text-[#34c759]' :
                subscription.status === 'expired' ? 'text-[#ff3b30]' :
                'text-[#707579]'
              }`}>
                {subscription.status.toUpperCase()}
              </div>
            </div>

            {subscription.started_at && (
              <div>
                <div className="text-[13px] text-[#707579] mb-[4px]">Started</div>
                <div className="text-[15px]">
                  {new Date(subscription.started_at).toLocaleString()}
                </div>
              </div>
            )}

            {subscription.expires_at && (
              <div>
                <div className="text-[13px] text-[#707579] mb-[4px]">Expires</div>
                <div className="text-[15px]">
                  {new Date(subscription.expires_at).toLocaleString()}
                </div>
              </div>
            )}

            {subscription.cancelled_at && (
              <div>
                <div className="text-[13px] text-[#707579] mb-[4px]">Cancelled</div>
                <div className="text-[15px]">
                  {new Date(subscription.cancelled_at).toLocaleString()}
                </div>
              </div>
            )}

            <div>
              <div className="text-[13px] text-[#707579] mb-[4px]">Billing Cycle</div>
              <div className="text-[15px]">{subscription.billing_cycle}</div>
            </div>

            <div>
              <div className="text-[13px] text-[#707579] mb-[4px]">Auto Renew</div>
              <div className="text-[15px]">{subscription.auto_renew ? 'Yes' : 'No'}</div>
            </div>

            {subscription.payment_provider && (
              <div>
                <div className="text-[13px] text-[#707579] mb-[4px]">Payment Provider</div>
                <div className="text-[15px]">{subscription.payment_provider}</div>
              </div>
            )}

            {subscription.transaction_reference && (
              <div>
                <div className="text-[13px] text-[#707579] mb-[4px]">Transaction Reference</div>
                <div className="text-[15px] font-mono text-[13px]">
                  {subscription.transaction_reference}
                </div>
              </div>
            )}
          </div>
        </TelegramCard>

        {/* Actions */}
        <div className="flex gap-[8px]">
          {subscription.status === 'active' && (
            <>
              <TelegramButton fullWidth onClick={handleExtend}>
                Extend
              </TelegramButton>
              <TelegramButton fullWidth variant="danger" onClick={handleCancel}>
                Cancel
              </TelegramButton>
            </>
          )}
          {(subscription.status === 'expired' || subscription.status === 'cancelled') && (
            <TelegramButton fullWidth onClick={handleActivate}>
              Activate
            </TelegramButton>
          )}
        </div>

        {/* Payment History */}
        <TelegramCard>
          <div className="p-[14px]">
            <h2 className="text-[17px] font-semibold mb-[12px]">Payment History</h2>
            {payments.length === 0 ? (
              <div className="text-[14px] text-[#707579]">No payments found</div>
            ) : (
              <div className="space-y-[8px]">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-[12px] bg-[#f2f3f5] dark:bg-[#181818] rounded-[8px]"
                  >
                    <div className="flex justify-between items-start mb-[4px]">
                      <div>
                        <div className="text-[15px] font-medium">
                          {payment.amount} {payment.currency}
                        </div>
                        <div className="text-[13px] text-[#707579]">
                          {payment.payment_provider}
                        </div>
                      </div>
                      <div className={`text-[13px] font-medium ${
                        payment.status === 'completed' ? 'text-[#34c759]' :
                        payment.status === 'failed' ? 'text-[#ff3b30]' :
                        'text-[#707579]'
                      }`}>
                        {payment.status}
                      </div>
                    </div>
                    {payment.transaction_reference && (
                      <div className="text-[12px] text-[#707579] font-mono mt-[4px]">
                        {payment.transaction_reference}
                      </div>
                    )}
                    <div className="text-[12px] text-[#707579] mt-[4px]">
                      {new Date(payment.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TelegramCard>
      </div>
    </div>
  )
}

