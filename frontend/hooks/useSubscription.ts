'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { subscriptionApi, SubscriptionStatus, SubscriptionPlan } from '@/lib/api/subscription'

export function useSubscription() {
  const { data: status, error: statusError, mutate: mutateStatus } = useSWR<SubscriptionStatus>(
    '/subscription/status',
    () => subscriptionApi.getStatus(),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 60000, // Refresh every minute
    }
  )

  const { data: plans, error: plansError } = useSWR<SubscriptionPlan[]>(
    '/subscription/plans',
    () => subscriptionApi.getPlans(),
    {
      revalidateOnFocus: false,
    }
  )

  const isLoading = !status && !statusError
  const hasActiveSubscription = status?.has_subscription && status.status === 'active'
  const isTrial = status?.is_trial || false
  const isExpired = status?.status === 'expired'
  const daysLeft = status?.days_left || null

  return {
    status,
    plans,
    isLoading,
    hasActiveSubscription,
    isTrial,
    isExpired,
    daysLeft,
    error: statusError || plansError,
    refetch: mutateStatus,
  }
}

