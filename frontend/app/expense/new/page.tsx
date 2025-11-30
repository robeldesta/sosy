'use client'

import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramInput } from '@/components/telegram/TelegramInput'
import { TelegramButton } from '@/components/telegram/TelegramButton'
import { BackButton } from '@/components/telegram/BackButton'
import { expenseApi, ExpenseCategory, ExpenseCreate } from '@/lib/api/expense'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useBackButton } from '@/hooks/useBackButton'
import { useMainButton } from '@/hooks/useMainButton'
import { useToastStore } from '@/stores/toastStore'

export default function NewExpensePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { webApp } = useTelegramWebApp()
  const { addToast } = useToastStore()
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [formData, setFormData] = useState<ExpenseCreate>({
    amount: 0,
    description: '',
    payment_method: 'cash',
    expense_date: new Date().toISOString().split('T')[0],
  })
  const [saving, setSaving] = useState(false)

  useBackButton()

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const data = await expenseApi.getCategories()
      setCategories(data)
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const handleSave = async () => {
    if (!formData.description.trim() || formData.amount <= 0) return
    if (saving) return

    setSaving(true)
    try {
      await expenseApi.createExpense(formData)
      webApp?.HapticFeedback?.notificationOccurred('success')
      addToast(t('expense.created'), 'success')
      router.push('/expense')
    } catch (error: any) {
      webApp?.HapticFeedback?.notificationOccurred('error')
      addToast(
        error.response?.data?.detail || t('expense.createError'),
        'error'
      )
    } finally {
      setSaving(false)
    }
  }

  const isFormValid = formData.description.trim() !== '' && formData.amount > 0

  useMainButton({
    text: t('common.save'),
    isActive: isFormValid && !saving,
    isVisible: true,
    onClick: handleSave,
  })

  return (
    <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] pb-[80px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#212121] border-b border-[#e5e5e5] dark:border-[#3a3a3a]">
        <div className="flex items-center px-[14px] py-[12px]">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-[20px] font-semibold leading-[24px]" suppressHydrationWarning>
              {t('expense.createExpense')}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-[14px] pt-[8px] space-y-[8px]">
        <TelegramCard>
          <TelegramInput
            label={t('expense.amount')}
            type="number"
            value={formData.amount.toString()}
            onChange={(value) => setFormData({ ...formData, amount: parseFloat(value) || 0 })}
            placeholder="0.00"
            required
          />

          <TelegramInput
            label={t('expense.description')}
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
            placeholder={t('expense.description')}
            required
            className="mt-[8px]"
          />

          <label className="block text-[14px] text-[#707579] dark:text-[#707579] mb-[6px] mt-[12px]" suppressHydrationWarning>
            {t('expense.category')}
          </label>
          <select
            value={formData.category_id || ''}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? parseInt(e.target.value) : undefined })}
            className="w-full px-[14px] py-[10px] text-[17px] bg-transparent border-b border-[#e5e5e5] dark:border-[#3a3a3a] focus:outline-none focus:border-[#3390ec] mb-[16px]"
          >
            <option value="">{t('expense.selectCategory')}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <label className="block text-[14px] text-[#707579] dark:text-[#707579] mb-[6px]" suppressHydrationWarning>
            {t('expense.paymentMethod')}
          </label>
          <select
            value={formData.payment_method}
            onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
            className="w-full px-[14px] py-[10px] text-[17px] bg-transparent border-b border-[#e5e5e5] dark:border-[#3a3a3a] focus:outline-none focus:border-[#3390ec] mb-[16px]"
          >
            <option value="cash">{t('payment.methods.cash')}</option>
            <option value="telebirr">{t('payment.methods.telebirr')}</option>
            <option value="bank">{t('payment.methods.bank')}</option>
          </select>

          <TelegramInput
            label={t('expense.date')}
            type="text"
            value={formData.expense_date || ''}
            onChange={(value) => setFormData({ ...formData, expense_date: value })}
            className="mt-[8px]"
          />

          <TelegramInput
            label={t('expense.notes')}
            value={formData.notes || ''}
            onChange={(value) => setFormData({ ...formData, notes: value })}
            placeholder={t('expense.notes')}
            className="mt-[8px]"
          />
        </TelegramCard>
      </div>
    </div>
  )
}

