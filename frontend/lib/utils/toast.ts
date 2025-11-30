import { useToastStore } from '@/stores/toastStore'

/**
 * Show a toast notification
 * @param message - The message to display
 * @param type - The type of toast (success, error, info)
 * @param duration - Duration in milliseconds (default: 3000)
 */
export function showToast(
  message: string,
  type: 'success' | 'error' | 'info' = 'info',
  duration: number = 3000
): void {
  const store = useToastStore.getState()
  store.addToast(message, type, duration)
}

