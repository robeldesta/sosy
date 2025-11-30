'use client'

import { useEffect, useState } from 'react'
import { syncWorker, SyncStatus } from '@/lib/sync/syncWorker'

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>(syncWorker.getStatus())

  useEffect(() => {
    // Start sync worker
    syncWorker.start(10000) // Sync every 10 seconds

    // Subscribe to status changes
    const unsubscribe = syncWorker.subscribe(setStatus)

    return () => {
      unsubscribe()
      // Don't stop worker on unmount - keep it running
    }
  }, [])

  return {
    ...status,
    syncNow: () => syncWorker.sync(),
  }
}

