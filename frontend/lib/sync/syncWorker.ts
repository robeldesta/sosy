/**
 * Background Sync Worker - Handles syncing with server
 */
import { syncQueue, SyncAction } from './syncQueue'
import { apiClient } from '@/lib/api/client'
import { isOnline } from '@/lib/utils/offline'

export interface SyncStatus {
  isSyncing: boolean
  lastSyncAt: Date | null
  pendingCount: number
  error: string | null
}

class SyncWorker {
  private syncInterval: NodeJS.Timeout | null = null
  private isSyncing = false
  private lastSyncAt: Date | null = null
  private listeners: Set<(status: SyncStatus) => void> = new Set()

  /**
   * Start background sync worker
   */
  start(intervalMs: number = 10000): void {
    if (this.syncInterval) {
      return // Already started
    }

    // Sync immediately
    this.sync()

    // Then sync every interval
    this.syncInterval = setInterval(() => {
      if (isOnline()) {
        this.sync()
      }
    }, intervalMs)

    // Also sync on online event
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.sync()
      })
    }
  }

  /**
   * Stop background sync worker
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  /**
   * Sync now (push and pull)
   */
  async sync(): Promise<void> {
    if (this.isSyncing || !isOnline()) {
      return
    }

    this.isSyncing = true
    this.notifyListeners()

    try {
      // Push unsynced actions
      await this.pushActions()

      // Pull changes from server
      await this.pullChanges()

      this.lastSyncAt = new Date()
      this.notifyListeners()
    } catch (error: any) {
      console.error('Sync failed:', error)
      this.notifyListeners()
    } finally {
      this.isSyncing = false
      this.notifyListeners()
    }
  }

  /**
   * Push unsynced actions to server
   */
  private async pushActions(): Promise<void> {
    const unsynced = syncQueue.getUnsynced()
    if (unsynced.length === 0) {
      return
    }

    try {
      const response = await apiClient.post('/sync/push', {
        device_id: this.getDeviceId(),
        actions: unsynced.map(action => ({
          id: action.id,
          type: action.type,
          payload: action.payload,
          created_at: action.created_at,
        })),
      })

      const { processed_ids, failed_ids } = response.data

      // Mark processed actions as synced
      processed_ids.forEach((id: string) => {
        syncQueue.markSynced(id)
      })

      // Increment retry count for failed actions
      failed_ids.forEach((id: string) => {
        syncQueue.incrementRetry(id)
      })

      // Clean up old synced actions periodically
      if (Math.random() < 0.1) { // 10% chance
        syncQueue.clearSynced()
      }
    } catch (error: any) {
      // Increment retry count for all actions on error
      unsynced.forEach(action => {
        syncQueue.incrementRetry(action.id)
      })
      throw error
    }
  }

  /**
   * Pull changes from server
   */
  private async pullChanges(): Promise<void> {
    try {
      const lastSync = this.lastSyncAt?.toISOString()
      const response = await apiClient.get('/sync/pull', {
        params: lastSync ? { since: lastSync } : {},
      })

      const { changes } = response.data

      // Apply changes to local cache
      // This would update products cache, stock cache, etc.
      // For now, we'll trigger a cache refresh
      if (changes.length > 0 && typeof window !== 'undefined') {
        // Emit event for components to refresh
        window.dispatchEvent(new CustomEvent('sync-changes', { detail: changes }))
      }
    } catch (error: any) {
      // Don't throw - pull failures are less critical
      console.error('Pull sync failed:', error)
    }
  }

  /**
   * Get device ID (simple implementation)
   */
  private getDeviceId(): string {
    if (typeof window === 'undefined') return 'unknown'
    
    let deviceId = localStorage.getItem('sosy_device_id')
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('sosy_device_id', deviceId)
    }
    return deviceId
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return {
      isSyncing: this.isSyncing,
      lastSyncAt: this.lastSyncAt,
      pendingCount: syncQueue.getUnsynced().length,
      error: null,
    }
  }

  /**
   * Subscribe to sync status changes
   */
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener)
    listener(this.getStatus()) // Call immediately

    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    const status = this.getStatus()
    this.listeners.forEach(listener => {
      try {
        listener(status)
      } catch (error) {
        console.error('Sync listener error:', error)
      }
    })
  }
}

// Singleton instance
export const syncWorker = new SyncWorker()

