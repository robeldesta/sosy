/**
 * Stock Take Sync - Offline-first counting support
 */
import { syncQueue } from './syncQueue'

export interface StockTakeCount {
  session_id: number
  product_id: number
  counted_qty: number
  notes?: string
}

/**
 * Queue stock take counts for sync
 */
export function queueStockTakeCounts(counts: StockTakeCount[]): void {
  // Add each count as a sync action
  counts.forEach(count => {
    syncQueue.add('stock_update', {
      session_id: count.session_id,
      product_id: count.product_id,
      counted_qty: count.counted_qty,
      notes: count.notes,
    })
  })
}

/**
 * Store counts locally (IndexedDB/localStorage fallback)
 */
export function storeLocalCounts(sessionId: number, counts: StockTakeCount[]): void {
  if (typeof window === 'undefined') return
  
  try {
    const key = `stock_take_${sessionId}_counts`
    const existing = localStorage.getItem(key)
    const existingCounts: StockTakeCount[] = existing ? JSON.parse(existing) : []
    
    // Merge counts (last count wins for same product)
    const merged = new Map<number, StockTakeCount>()
    
    // Add existing
    existingCounts.forEach(c => {
      merged.set(c.product_id, c)
    })
    
    // Add/update new counts
    counts.forEach(c => {
      merged.set(c.product_id, c)
    })
    
    localStorage.setItem(key, JSON.stringify(Array.from(merged.values())))
  } catch (error) {
    console.error('Failed to store local counts:', error)
  }
}

/**
 * Get local counts for session
 */
export function getLocalCounts(sessionId: number): StockTakeCount[] {
  if (typeof window === 'undefined') return []
  
  try {
    const key = `stock_take_${sessionId}_counts`
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

/**
 * Clear local counts after successful sync
 */
export function clearLocalCounts(sessionId: number): void {
  if (typeof window === 'undefined') return
  
  try {
    const key = `stock_take_${sessionId}_counts`
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Failed to clear local counts:', error)
  }
}

