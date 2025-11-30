/**
 * Sync Queue - Stores actions to be synced with server
 */

// Simple UUID generator
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export interface SyncAction {
  id: string
  type: 'sale' | 'stock_update' | 'product_update' | 'invoice'
  payload: any
  created_at: string
  synced: boolean
  retry_count: number
}

const SYNC_QUEUE_KEY = 'sosy_sync_queue'
const MAX_RETRIES = 5

export const syncQueue = {
  /**
   * Get all sync actions from localStorage
   */
  getAll(): SyncAction[] {
    if (typeof window === 'undefined') return []
    try {
      const data = localStorage.getItem(SYNC_QUEUE_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },

  /**
   * Get unsynced actions
   */
  getUnsynced(): SyncAction[] {
    return this.getAll().filter(action => !action.synced && action.retry_count < MAX_RETRIES)
  },

  /**
   * Add action to sync queue
   */
  add(type: SyncAction['type'], payload: any): string {
    const actionId = uuidv4()
    const action: SyncAction = {
      id: actionId,
      type,
      payload,
      created_at: new Date().toISOString(),
      synced: false,
      retry_count: 0,
    }

    const queue = this.getAll()
    queue.push(action)
    this.save(queue)
    return actionId
  },

  /**
   * Mark action as synced
   */
  markSynced(actionId: string): void {
    const queue = this.getAll()
    const action = queue.find(a => a.id === actionId)
    if (action) {
      action.synced = true
      this.save(queue)
    }
  },

  /**
   * Increment retry count
   */
  incrementRetry(actionId: string): void {
    const queue = this.getAll()
    const action = queue.find(a => a.id === actionId)
    if (action) {
      action.retry_count += 1
      this.save(queue)
    }
  },

  /**
   * Remove action from queue
   */
  remove(actionId: string): void {
    const queue = this.getAll().filter(a => a.id !== actionId)
    this.save(queue)
  },

  /**
   * Clear all synced actions (keep unsynced)
   */
  clearSynced(): void {
    const queue = this.getAll().filter(a => !a.synced)
    this.save(queue)
  },

  /**
   * Clear entire queue
   */
  clear(): void {
    this.save([])
  },

  /**
   * Save queue to localStorage
   */
  save(queue: SyncAction[]): void {
    if (typeof window === 'undefined') return
    try {
      // Keep only last 1000 actions to prevent localStorage bloat
      const limited = queue.slice(-1000)
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(limited))
    } catch (error) {
      console.error('Failed to save sync queue:', error)
    }
  },
}


