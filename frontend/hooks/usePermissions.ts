'use client'

import { useEffect, useState } from 'react'
import { permissionsApi, UserCapabilities } from '@/lib/api/permissions'

export function usePermissions() {
  const [capabilities, setCapabilities] = useState<UserCapabilities | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCapabilities()
  }, [])

  const loadCapabilities = async () => {
    try {
      const data = await permissionsApi.getCapabilities()
      setCapabilities(data)
    } catch (error) {
      console.error('Failed to load permissions:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    capabilities,
    loading,
    isOwner: capabilities?.role === 'owner',
    isManager: capabilities?.role === 'manager',
    isStaff: capabilities?.role === 'staff',
    canViewCostPrices: capabilities?.can_view_cost_prices ?? false,
    canAccessReports: capabilities?.can_access_reports ?? false,
    canAccessSettings: capabilities?.can_access_settings ?? false,
    canManageStaff: capabilities?.can_manage_staff ?? false,
    canReconcileCash: capabilities?.can_reconcile_cash ?? false,
    refresh: loadCapabilities,
  }
}

