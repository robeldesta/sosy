import { create } from 'zustand'
import { dashboardApi, DashboardData } from '@/lib/api/dashboard'
import { useToastStore } from './toastStore'

interface DashboardState {
  data: DashboardData | null
  loading: boolean
  error: string | null
  fetchDashboard: () => Promise<void>
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  data: null,
  loading: false,
  error: null,

  fetchDashboard: async () => {
    set({ loading: true, error: null })
    try {
      const data = await dashboardApi.getDashboard()
      set({ data, loading: false })
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to fetch dashboard data'
      set({ error: errorMessage, loading: false })
      useToastStore.getState().addToast(errorMessage, 'error')
    }
  },
}))

