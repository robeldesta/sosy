/**
 * Offline resilience utilities
 */

export interface OfflineQueueItem {
  id: string
  method: 'POST' | 'PUT' | 'DELETE'
  url: string
  data: any
  timestamp: number
  retries: number
}

const OFFLINE_QUEUE_KEY = 'sosy_offline_queue'
const MAX_RETRIES = 3
const RETRY_DELAY_BASE = 1000 // 1 second base delay

/**
 * Check if browser is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine
}

/**
 * Get offline queue from localStorage
 */
export function getOfflineQueue(): OfflineQueueItem[] {
  if (typeof window === 'undefined') return []
  
  try {
    const queue = localStorage.getItem(OFFLINE_QUEUE_KEY)
    return queue ? JSON.parse(queue) : []
  } catch {
    return []
  }
}

/**
 * Save offline queue to localStorage
 */
export function saveOfflineQueue(queue: OfflineQueueItem[]): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
  } catch (error) {
    console.error('Failed to save offline queue:', error)
  }
}

/**
 * Add request to offline queue
 */
export function addToOfflineQueue(
  method: 'POST' | 'PUT' | 'DELETE',
  url: string,
  data: any
): string {
  const queue = getOfflineQueue()
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  const item: OfflineQueueItem = {
    id,
    method,
    url,
    data,
    timestamp: Date.now(),
    retries: 0,
  }
  
  queue.push(item)
  saveOfflineQueue(queue)
  return id
}

/**
 * Remove item from offline queue
 */
export function removeFromOfflineQueue(id: string): void {
  const queue = getOfflineQueue()
  const filtered = queue.filter(item => item.id !== id)
  saveOfflineQueue(filtered)
}

/**
 * Process offline queue with exponential backoff
 */
export async function processOfflineQueue(
  apiClient: any
): Promise<void> {
  if (!isOnline()) return
  
  const queue = getOfflineQueue()
  if (queue.length === 0) return
  
  const processed: string[] = []
  
  for (const item of queue) {
    if (item.retries >= MAX_RETRIES) {
      // Max retries reached, remove from queue
      processed.push(item.id)
      continue
    }
    
    try {
      const delay = RETRY_DELAY_BASE * Math.pow(2, item.retries)
      await new Promise(resolve => setTimeout(resolve, delay))
      
      let response
      switch (item.method) {
        case 'POST':
          response = await apiClient.post(item.url, item.data)
          break
        case 'PUT':
          response = await apiClient.put(item.url, item.data)
          break
        case 'DELETE':
          response = await apiClient.delete(item.url)
          break
      }
      
      // Success - remove from queue
      processed.push(item.id)
    } catch (error) {
      // Failed - increment retries
      item.retries++
      const updatedQueue = getOfflineQueue().map(q =>
        q.id === item.id ? item : q
      )
      saveOfflineQueue(updatedQueue)
    }
  }
  
  // Remove processed items
  if (processed.length > 0) {
    const remaining = queue.filter(item => !processed.includes(item.id))
    saveOfflineQueue(remaining)
  }
}

/**
 * Save draft to localStorage
 */
export function saveDraft(key: string, data: any): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(`sosy_draft_${key}`, JSON.stringify({
      data,
      timestamp: Date.now(),
    }))
  } catch (error) {
    console.error('Failed to save draft:', error)
  }
}

/**
 * Get draft from localStorage
 */
export function getDraft<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  
  try {
    const draft = localStorage.getItem(`sosy_draft_${key}`)
    if (!draft) return null
    
    const parsed = JSON.parse(draft)
    // Draft expires after 7 days
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    if (Date.now() - parsed.timestamp > sevenDays) {
      localStorage.removeItem(`sosy_draft_${key}`)
      return null
    }
    
    return parsed.data as T
  } catch {
    return null
  }
}

/**
 * Clear draft
 */
export function clearDraft(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(`sosy_draft_${key}`)
}

