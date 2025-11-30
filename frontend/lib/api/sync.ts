import { apiClient } from './client'

export interface SyncActionRequest {
  id: string
  type: string
  payload: any
  created_at: string
}

export interface SyncPushRequest {
  device_id?: string
  actions: SyncActionRequest[]
}

export interface SyncPushResponse {
  success: boolean
  processed_ids: string[]
  failed_ids: string[]
  errors: Record<string, string>
}

export interface SyncChange {
  type: string
  entity_id: number
  data: any
  updated_at: string
  action: string
}

export interface SyncPullResponse {
  server_time: string
  changes: SyncChange[]
  has_more: boolean
}

export interface SyncState {
  last_sync_at: string | null
  last_pull_at: string | null
  sync_version: number
}

export const syncApi = {
  // Push sync actions
  async push(data: SyncPushRequest): Promise<SyncPushResponse> {
    const response = await apiClient.post<SyncPushResponse>('/sync/push', data)
    return response.data
  },

  // Pull changes
  async pull(since?: string): Promise<SyncPullResponse> {
    const response = await apiClient.get<SyncPullResponse>('/sync/pull', {
      params: since ? { since } : {},
    })
    return response.data
  },

  // Get sync state
  async getState(): Promise<SyncState> {
    const response = await apiClient.get<SyncState>('/sync/state')
    return response.data
  },
}

