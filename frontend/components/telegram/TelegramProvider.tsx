'use client'

import { SDKProvider } from '@telegram-apps/sdk-react'
import { ReactNode } from 'react'

interface TelegramProviderProps {
  children: ReactNode
}

export function TelegramProvider({ children }: TelegramProviderProps) {
  return (
    <SDKProvider acceptCustomStyles debug>
      {children}
    </SDKProvider>
  )
}

