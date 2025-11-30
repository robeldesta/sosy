'use client'

import { useEffect } from 'react'
import { useSync } from '@/hooks/useSync'

export function SyncInitializer() {
  useSync() // This starts the sync worker
  return null
}

