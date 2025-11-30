'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSubscription } from '@/hooks/useSubscription'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useMainButton } from '@/hooks/useMainButton'
import { TelegramButton } from '@/components/telegram/TelegramButton'
import { PaymentModal } from '@/components/subscription/PaymentModal'
import { subscriptionApi } from '@/lib/api/subscription'
import { showToast } from '@/lib/utils/toast'
import { TelegramListItem } from '@/components/telegram/TelegramListItem'

export default function SubscribePage() {
  const router = useRouter()
  const { webApp, themeParams } = useTelegramWebApp()
  const { status, plans, isLoading, hasActiveSubscription, isTrial, daysLeft } = useSubscription()
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  // Setup BackButton
  useEffect(() => {
    if (webApp?.BackButton) {
      webApp.BackButton.show()
      const handleBack = () => router.back()
      webApp.BackButton.onClick(handleBack)

      return () => {
        webApp.BackButton.offClick(handleBack)
        webApp.BackButton.hide()
      }
    }
  }, [webApp, router])

  const handleUpgrade = (plan: any) => {
    setSelectedPlan(plan)
    setShowPaymentModal(true)
  }

  const formatPrice = (price: number, currency: string) => {
    return `${currency} ${price.toLocaleString()}`
  }

  const getPriceForCycle = (plan: any) => {
    if (billingCycle === 'yearly' && plan.price_yearly) {
      return plan.price_yearly
    }
    return plan.price_monthly
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--tg-theme-bg-color,#ffffff)]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#3390ec] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--tg-theme-text-color,#000000)] text-[17px]">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--tg-theme-bg-color,#ffffff)]">
      {/* Header with gradient */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(180deg, ${themeParams.button_color || '#3390ec'} 0%, ${themeParams.button_color || '#3390ec'}dd 100%)`,
        }}
      >
        <div className="p-6 pt-safe pb-8">
          {/* Current Plan Badge */}
          {hasActiveSubscription && status && (
            <div className="mb-6">
              <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <div className="text-white text-[15px] font-medium">
                  Current Plan: {status.plan_name}
                </div>
                {daysLeft !== null && (
                  <div className="text-white/80 text-[13px] mt-1">
                    {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Title */}
          <h1 className="text-[32px] font-bold text-white mb-2">
            {hasActiveSubscription ? 'Manage Subscription' : 'Upgrade Your Plan'}
          </h1>
          <p className="text-white/90 text-[17px] leading-relaxed">
            {hasActiveSubscription
              ? 'Choose a plan that fits your business needs'
              : 'Unlock all features and grow your business'}
          </p>
        </div>

        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
      </div>

      {/* Billing Cycle Toggle */}
      {plans && plans.length > 0 && (
        <div className="px-4 pt-6 pb-4">
          <div className="flex gap-2 bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)] rounded-full p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`flex-1 py-2 px-4 rounded-full text-[15px] font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-[#3390ec] text-white'
                  : 'text-[var(--tg-theme-text-color,#000000)]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`flex-1 py-2 px-4 rounded-full text-[15px] font-medium transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-[#3390ec] text-white'
                  : 'text-[var(--tg-theme-text-color,#000000)]'
              }`}
            >
              Yearly
              {billingCycle === 'yearly' && (
                <span className="ml-1 text-[12px] opacity-90">Save 20%</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Plans List */}
      <div className="px-4 pb-6 space-y-4">
        {plans
          ?.filter((plan) => plan.code !== 'free_trial' && plan.is_active)
          .map((plan) => {
            const price = getPriceForCycle(plan)
            const isCurrentPlan = status?.plan_code === plan.code
            const isPopular = plan.code === 'pro'

            return (
              <div
                key={plan.id}
                className={`relative bg-[var(--tg-theme-bg-color,#ffffff)] rounded-[16px] border-2 overflow-hidden ${
                  isCurrentPlan
                    ? 'border-[#3390ec]'
                    : isPopular
                    ? 'border-[#3390ec]/50'
                    : 'border-[var(--tg-theme-secondary-bg-color,#f0f0f0)]'
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-[#3390ec] text-white text-[12px] font-semibold px-3 py-1 rounded-bl-[12px]">
                    POPULAR
                  </div>)}

                <div className="p-5">
                  {/* Plan Name & Price */}
                  <div className="mb-4">
                    <h3 className="text-[20px] font-bold text-[var(--tg-theme-text-color,#000000)] mb-1">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[28px] font-bold text-[var(--tg-theme-text-color,#000000)]">
                        {formatPrice(price, plan.currency)}
                      </span>
                      <span className="text-[15px] text-[var(--tg-theme-hint-color,#999999)]">
                        /{billingCycle === 'monthly' ? 'month' : 'year'}
                      </span>
                    </div>
                    {plan.description && (
                      <p className="text-[15px] text-[var(--tg-theme-hint-color,#999999)] mt-2">
                        {plan.description}
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-5">
                    {plan.max_products && (
                      <div className="flex items-center gap-2 text-[15px]">
                        <svg
                          className="w-5 h-5 text-[#3390ec] flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-[var(--tg-theme-text-color,#000000)]">
                          Up to {plan.max_products.toLocaleString()} products
                        </span>
                      </div>
                    )}
                    {plan.max_invoices && (
                      <div className="flex items-center gap-2 text-[15px]">
                        <svg
                          className="w-5 h-5 text-[#3390ec] flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-[var(--tg-theme-text-color,#000000)]">
                          Up to {plan.max_invoices.toLocaleString()} invoices/month
                        </span>
                      </div>
                    )}
                    {plan.max_users > 1 && (
                      <div className="flex items-center gap-2 text-[15px]">
                        <svg
                          className="w-5 h-5 text-[#3390ec] flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-[var(--tg-theme-text-color,#000000)]">
                          {plan.max_users === null ? 'Unlimited' : plan.max_users} staff members
                        </span>
                      </div>
                    )}
                    {plan.features?.reports && (
                      <div className="flex items-center gap-2 text-[15px]">
                        <svg
                          className="w-5 h-5 text-[#3390ec] flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-[var(--tg-theme-text-color,#000000)]">
                          Advanced Reports
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  {isCurrentPlan ? (
                    <div className="bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)] rounded-[12px] py-3 text-center">
                      <span className="text-[15px] font-medium text-[var(--tg-theme-text-color,#000000)]">
                        Current Plan
                      </span>
                    </div>
                  ) : (
                    <TelegramButton
                      onClick={() => handleUpgrade(plan)}
                      fullWidth
                      variant={isPopular ? 'primary' : 'secondary'}
                    >
                      {hasActiveSubscription ? 'Switch Plan' : 'Subscribe'}
                    </TelegramButton>
                  )}
                </div>
              </div>
            )
          })}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <PaymentModal
          planCode={selectedPlan.code}
          planName={selectedPlan.name}
          price={getPriceForCycle(selectedPlan)}
          currency={selectedPlan.currency}
          billingCycle={billingCycle}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedPlan(null)
          }}
          onSuccess={() => {
            showToast('Payment initiated successfully', 'success')
            // Refresh subscription status
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}

