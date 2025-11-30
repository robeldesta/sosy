'use client'

import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramInput } from '@/components/telegram/TelegramInput'
import { TelegramButton } from '@/components/telegram/TelegramButton'
import { PaymentCreate } from '@/lib/api/payment'

interface PaymentModalProps {
  invoiceId: number
  outstandingBalance: number
  onClose: () => void
  onSuccess: () => void
}

export function PaymentModal({ invoiceId, outstandingBalance, onClose, onSuccess }: PaymentModalProps) {
  const { t } = useTranslation()
  const [amount, setAmount] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')
  const [bankName, setBankName] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    const paymentAmount = parseFloat(amount)
    if (!paymentAmount || paymentAmount <= 0) {
      return
    }
    if (paymentAmount > outstandingBalance) {
      return
    }

    setSaving(true)
    try {
      const paymentData: PaymentCreate = {
        invoice_id: invoiceId,
        amount: paymentAmount,
        payment_method: paymentMethod,
        bank_name: paymentMethod === 'bank' ? bankName : undefined,
        notes: notes || undefined,
      }

      const { paymentApi } = await import('@/lib/api/payment')
      await paymentApi.createPayment(paymentData)
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Failed to record payment:', error)
    } finally {
      setSaving(false)
    }
  }

  const isFormValid = parseFloat(amount) > 0 && parseFloat(amount) <= outstandingBalance

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end">
      <div className="w-full bg-white dark:bg-[#212121] rounded-t-[20px] p-[14px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-[16px]">
          <h2 className="text-[20px] font-semibold" suppressHydrationWarning>
            {t('payment.recordPayment')}
          </h2>
          <button
            onClick={onClose}
            className="text-[#707579] text-[24px] leading-none"
            suppressHydrationWarning
          >
            ×
          </button>
        </div>

        <TelegramCard>
          <div className="text-[14px] text-[#707579] mb-[8px]" suppressHydrationWarning>
            {t('payment.outstandingBalance')}
          </div>
          <div className="text-[20px] font-bold mb-[16px]" suppressHydrationWarning>
            {outstandingBalance.toLocaleString()} ETB
          </div>

          <TelegramInput
            label={t('payment.amount')}
            type="number"
            value={amount}
            onChange={setAmount}
            placeholder="0.00"
            required
          />

          <label className="block text-[14px] text-[#707579] dark:text-[#707579] mb-[6px] mt-[12px]" suppressHydrationWarning>
            {t('payment.method')}
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-[14px] py-[10px] text-[17px] bg-transparent border-b border-[#e5e5e5] dark:border-[#3a3a3a] focus:outline-none focus:border-[#3390ec] mb-[16px]"
          >
            <option value="cash">{t('payment.methods.cash')}</option>
            <option value="telebirr">{t('payment.methods.telebirr')}</option>
            <option value="bank">{t('payment.methods.bank')}</option>
            <option value="other">{t('payment.methods.other')}</option>
          </select>

          {paymentMethod === 'bank' && (
            <TelegramInput
              label={t('payment.bankName')}
              value={bankName}
              onChange={setBankName}
              placeholder="CBE, Awash, Dashen..."
            />
          )}

          <TelegramInput
            label={t('payment.notes')}
            value={notes}
            onChange={setNotes}
            placeholder={t('payment.notesPlaceholder')}
            className="mt-[8px]"
          />

          {parseFloat(amount) > outstandingBalance && (
            <div className="text-[14px] text-[#ff3b30] mt-[8px]" suppressHydrationWarning>
              {t('payment.amountExceedsBalance')}
            </div>
          )}
        </TelegramCard>

        <div className="flex gap-[8px] mt-[16px]">
          <TelegramButton
            variant="secondary"
            fullWidth
            onClick={onClose}
            disabled={saving}
          >
            {t('common.cancel')}
          </TelegramButton>
          <TelegramButton
            variant="primary"
            fullWidth
            onClick={handleSubmit}
            disabled={!isFormValid || saving}
          >
            {saving ? t('common.saving') : t('payment.record')}
          </TelegramButton>
        </div>
      </div>
    </div>
  )
}

