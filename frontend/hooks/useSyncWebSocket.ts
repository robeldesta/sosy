/**
 * Hook to manage WebSocket connection for real-time sync
 */
import { useEffect, useRef, useState } from 'react'
import { getSyncClient, SyncWebSocketClient } from '@/lib/websocket/syncClient'
import { useAuthStore } from '@/stores/authStore'
import { useBusinessStore } from '@/stores/businessStore'

export function useSyncWebSocket() {
  const { user } = useAuthStore()
  const { business } = useBusinessStore()
  const clientRef = useRef<SyncWebSocketClient | null>(null)

  useEffect(() => {
    if (!user || !business) {
      return
    }

    const client = getSyncClient()
    clientRef.current = client

    // Connect to WebSocket
    client.connect(business.id, user.id)

    // Listen for sync events
    const handleSaleCreated = (data: any) => {
      console.log('[Sync] Sale created:', data)
      // Refresh relevant data
      window.dispatchEvent(new CustomEvent('sync-sale-created', { detail: data }))
    }

    const handleStockUpdated = (data: any) => {
      console.log('[Sync] Stock updated:', data)
      window.dispatchEvent(new CustomEvent('sync-stock-updated', { detail: data }))
    }

    const handleProductUpdated = (data: any) => {
      console.log('[Sync] Product updated:', data)
      window.dispatchEvent(new CustomEvent('sync-product-updated', { detail: data }))
    }

    client.on('SALE_CREATED', handleSaleCreated)
    client.on('STOCK_UPDATED', handleStockUpdated)
    client.on('PRODUCT_UPDATED', handleProductUpdated)

    return () => {
      client.off('SALE_CREATED', handleSaleCreated)
      client.off('STOCK_UPDATED', handleStockUpdated)
      client.off('PRODUCT_UPDATED', handleProductUpdated)
      client.disconnect()
    }
  }, [user?.id, business?.id])

  return {
    isConnected: () => clientRef.current?.isConnected() || false,
    emitSyncEvent: (eventType: string, payload: any) => {
      clientRef.current?.emitSyncEvent(eventType, payload)
    },
  }
}

