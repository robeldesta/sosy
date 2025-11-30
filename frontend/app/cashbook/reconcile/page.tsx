'use client'

import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramInput } from '@/components/telegram/TelegramInput'
import { TelegramButton } from '@/components/telegram/TelegramButton'
import { BackButton } from '@/components/telegram/BackButton'
import { cashbookApi, CashbookSummary } from '@/lib/api/cashbook'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useBackButton } from '@/hooks/useBackButton'
import { useMainButton } from '@/hooks/useMainButton'
import { useToastStore } from '@/stores/toastStore'
import { useEffect } from 'react'

export default function ReconcileCashPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { webApp } = useTelegramWebApp()
  const { addToast } = useToastStore()
  const [summary, setSummary] = useState<CashbookSummary | null>(null)
  const [actualCash, setActualCash] = useState<string>('')
  const [adjustmentReason, setAdjustmentReason] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [reconciling, setReconciling] = useState(false)
  const [loading, setLoading] = useState(true)

  useBackButton()

  useEffect(() => {
    loadSummary()
  }, [])

  const loadSummary = async () => {
    try {
      const data = await cashbookApi.getSummary()
      setSummary(data)
      setActualCash(data.net_cash.toFixed(2))
    } catch (error) {
      console.error('Failed to load cashbook summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReconcile = async () => {
    const actual = parseFloat(actualCash)
    if (isNaN(actual) || actual < 0) return
    if (reconciling) return

    setReconciling(true)
    try {
      await cashbookApi.reconcile({
        actual_cash: actual,
        adjustment_reason: adjustmentReason || undefined,
        notes: notes || undefined,
      })
      webApp?.HapticFeedback?.notificationOccurred('success')
      addToast(t('cashbook.reconciled'), 'success')
      router.push('/cashbook')
    } catch (error: any) {
      webApp?.HapticFeedback?.notificationOccurred('error')
      addToast(
        error.response?.data?.detail || t('cashbook.reconcileError'),
        'error'
      )
    } finally {
      setReconciling(false)
    }
  }

  const expectedCash = summary?.net_cash || 0
  const actual = parseFloat(actualCash) || 0
  const difference = actual - expectedCash
  const isFormValid = actualCash !== '' && actual >= 0

  useMainButton({
    text: t('cashbook.reconcile'),
    isActive: isFormValid && !reconciling,
    isVisible: true,
    onClick: handleReconcile,
  })

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ETB`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] flex items-center justify-center">
        <div className="text-[#707579] text-[15px]" suppressHydrationWarning>{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] pb-[80px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#212121] border-b border-[#e5e5e5] dark:border-[#3a3a3a]">
        <div className="flex items-center px-[14px] py-[12px]">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-[20px] font-semibold leading-[24px]" suppressHydrationWarning>
              {t('cashbook.reconcile')}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-[14px] pt-[8px] space-y-[8px]">
        {/* Expected Cash */}
        <TelegramCard>
          <div className="text-[12px] text-[#707579] mb-[4px]" suppressHydrationWarning>
            {t('cashbook.expectedCash')}
          </div>
          <div className="text-[24px] font-bold" suppressHydrationWarning>
            {formatCurrency(expectedCash)}
          </div>
          <div className="text-[14px] text-[#707579] mt-[4px]" suppressHydrationWarning>
            {t('cashbook.expectedCashDesc')}
          </div>
        </TelegramCard>

        {/* Actual Cash Input */}
        <TelegramCard>
          <TelegramInput
            label={t('cashbook.actualCash')}
            type="number"
            value={actualCash}
            onChange={setActualCash}
            placeholder="0.00"
            required
          />

          {/* Difference */}
          {actualCash && !isNaN(parseFloat(actualCash)) && (
            <div className="mt-[12px] pt-[12px] border-t border-[#e5e5e5] dark:border-[#3a3a3a]">
              <div className="text-[14px] text-[#707579] mb-[4px]" suppressHydrationWarning>
                {t('cashbook.difference')}
              </div>
              <div className={`text-[20px] font-bold ${
                Math.abs(difference) < 0.01 ? 'text-[#34c759]' : difference > 0 ? 'text-[#ff9500]' : 'text-[#ff3b30]'
              }`} suppressHydrationWarning>
                {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
              </div>
              {Math.abs(difference) >= 0.01 && (
                <div className="text-[13px] text-[#707579] mt-[4px]" suppressHydrationWarning>
                  {t('cashbook.differenceDesc')}
                </div>
              )}
            </div>
          )}
        </TelegramCard>

        {/* Adjustment Reason */}
        {Math.abs(difference) >= 0.01 && (
          <TelegramCard>
            <TelegramInput
              label={t('cashbook.adjustmentReason')}
              value={adjustmentReason}
              onChange={setAdjustmentReason}
              placeholder={t('cashbook.adjustmentReasonPlaceholder')}
            />
            <TelegramInput
              label={t('cashbook.notes')}
              value={notes}
              onChange={setNotes}
              placeholder={t('cashbook.notesPlaceholder')}
              className="mt-[8px]"
            />
          </TelegramCard>
        )}
      </div>
    </div>
  )
}

