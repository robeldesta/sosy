'use client'

import { useState, useEffect } from 'react'
import { isOnline } from '@/lib/utils/offline'

export function OfflineIndicator() {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    setOnline(isOnline())
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (online) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[#ff3b30] text-white text-center py-[6px] px-[14px]">
      <div className="text-[13px] font-medium">
        🔴 No connection, retrying...
      </div>
    </div>
  )
}

