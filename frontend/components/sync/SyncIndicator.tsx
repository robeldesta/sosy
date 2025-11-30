'use client'

import { useEffect, useState } from 'react'
import { syncWorker, SyncStatus } from '@/lib/sync/syncWorker'

export function SyncIndicator() {
  const [status, setStatus] = useState<SyncStatus>(syncWorker.getStatus())

  useEffect(() => {
    const unsubscribe = syncWorker.subscribe(setStatus)
    return unsubscribe
  }, [])

  if (status.pendingCount === 0 && !status.isSyncing) {
    return null // Don't show if nothing to sync
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
          status.isSyncing
            ? 'bg-[#3390ec] animate-pulse'
            : status.pendingCount > 0
            ? 'bg-[#707579]'
            : 'bg-transparent'
        }`}
        title={
          status.isSyncing
            ? 'Syncing...'
            : status.pendingCount > 0
            ? `${status.pendingCount} pending`
            : 'Synced'
        }
      >
        {status.isSyncing ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : status.pendingCount > 0 ? (
          <div className="w-2 h-2 bg-white rounded-full"></div>
        ) : null}
      </div>
    </div>
  )
}

