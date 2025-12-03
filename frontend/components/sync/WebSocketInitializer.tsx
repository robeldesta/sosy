'use client'

import { useSyncWebSocket } from '@/hooks/useSyncWebSocket'

/**
 * Component to initialize WebSocket connection for real-time sync
 */
export function WebSocketInitializer() {
  useSyncWebSocket()
  return null
}

