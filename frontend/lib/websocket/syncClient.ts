/**
 * WebSocket client for real-time sync
 */
// WebSocket client for real-time sync

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const WS_URL = API_URL.replace('http://', 'ws://').replace('https://', 'wss://')

export interface SyncMessage {
  type: string
  payload?: any
  timestamp?: string
}

export class SyncWebSocketClient {
  private ws: WebSocket | null = null
  private businessId: number | null = null
  private userId: number | null = null
  private deviceId: string | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private listeners: Map<string, Set<(data: any) => void>> = new Map()
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      // Generate device ID
      this.deviceId = localStorage.getItem('device_id') || this.generateDeviceId()
      localStorage.setItem('device_id', this.deviceId)
    }
  }

  private generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  connect(businessId: number, userId: number): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      if (this.businessId === businessId && this.userId === userId) {
        return // Already connected
      }
      this.disconnect()
    }

    this.businessId = businessId
    this.userId = userId

    const url = `${WS_URL}/ws/${businessId}?user_id=${userId}${this.deviceId ? `&device_id=${this.deviceId}` : ''}`
    
    try {
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        console.log('[SyncWebSocket] Connected')
        this.reconnectAttempts = 0
        this.startHeartbeat()
        this.emit('connected', { businessId, userId })
      }

      this.ws.onmessage = (event) => {
        try {
          const message: SyncMessage = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('[SyncWebSocket] Failed to parse message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('[SyncWebSocket] Error:', error)
        this.emit('error', { error })
      }

      this.ws.onclose = () => {
        console.log('[SyncWebSocket] Disconnected')
        this.stopHeartbeat()
        this.emit('disconnected', {})
        this.attemptReconnect()
      }
    } catch (error) {
      console.error('[SyncWebSocket] Failed to connect:', error)
      this.attemptReconnect()
    }
  }

  disconnect(): void {
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.businessId = null
    this.userId = null
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[SyncWebSocket] Max reconnect attempts reached')
      return
    }

    if (!this.businessId || !this.userId) {
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) // Exponential backoff

    setTimeout(() => {
      console.log(`[SyncWebSocket] Reconnecting (attempt ${this.reconnectAttempts})...`)
      this.connect(this.businessId!, this.userId!)
    }, delay)
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' })
      }
    }, 30000) // Ping every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private handleMessage(message: SyncMessage): void {
    const type = message.type
    
    switch (type) {
      case 'connected':
        console.log('[SyncWebSocket] Server confirmed connection')
        break
      case 'pong':
        // Heartbeat response
        break
      case 'SALE_CREATED':
      case 'STOCK_UPDATED':
      case 'PRODUCT_UPDATED':
      case 'INVOICE_CREATED':
      case 'PAYMENT_RECEIVED':
        // Broadcast sync events
        this.emit(message.type, message.payload)
        break
      default:
        this.emit(message.type, message.payload)
    }
  }

  send(message: SyncMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('[SyncWebSocket] Cannot send message, not connected')
    }
  }

  emitSyncEvent(eventType: string, payload: any): void {
    this.send({
      type: 'sync_event',
      event_type: eventType,
      payload,
    })
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: string, callback: (data: any) => void): void {
    this.listeners.get(event)?.delete(callback)
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach((callback) => {
      try {
        callback(data)
      } catch (error) {
        console.error(`[SyncWebSocket] Error in listener for ${event}:`, error)
      }
    })
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// Singleton instance
let syncClientInstance: SyncWebSocketClient | null = null

export function getSyncClient(): SyncWebSocketClient {
  if (!syncClientInstance) {
    syncClientInstance = new SyncWebSocketClient()
  }
  return syncClientInstance
}

