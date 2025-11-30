'use client'

import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramListItem } from '@/components/telegram/TelegramListItem'
import { TelegramButton } from '@/components/telegram/TelegramButton'
import { BackButton } from '@/components/telegram/BackButton'
import { expenseApi, Expense } from '@/lib/api/expense'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useBackButton } from '@/hooks/useBackButton'
import { useToastStore } from '@/stores/toastStore'
import { SkeletonCard } from '@/components/telegram/SkeletonLoader'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'

export default function ExpensePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user } = useTelegramWebApp()
  const { addToast } = useToastStore()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useBackButton()

  useEffect(() => {
    loadExpenses()
  }, [])

  const loadExpenses = async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await expenseApi.getExpenses()
      setExpenses(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || t('expense.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ETB`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] pb-[80px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#212121] border-b border-[#e5e5e5] dark:border-[#3a3a3a]">
        <div className="flex items-center px-[14px] py-[12px]">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-[20px] font-semibold leading-[24px]" suppressHydrationWarning>
              {t('expense.title')}
            </h1>
            {user?.first_name && (
              <div className="text-[14px] text-[#707579] mt-[2px]" suppressHydrationWarning>
                {user.first_name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-[14px] pt-[8px] space-y-[8px]">
        <Link href="/expense/new">
          <TelegramButton variant="primary" fullWidth>
            {t('expense.addExpense')}
          </TelegramButton>
        </Link>

        {error ? (
          <ErrorState message={error} onRetry={loadExpenses} />
        ) : loading ? (
          <div className="space-y-[8px]">
            {[...Array(5)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <EmptyState
            title={t('expense.noExpenses')}
            actionLabel={t('expense.createFirst')}
            onAction={() => router.push('/expense/new')}
          />
        ) : (
          <div className="space-y-[8px]">
            {expenses.map((expense) => (
              <TelegramCard key={expense.id}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-[15px] font-medium mb-[4px]" suppressHydrationWarning>
                      {expense.description}
                    </div>
                    <div className="text-[13px] text-[#707579]" suppressHydrationWarning>
                      {formatDate(expense.expense_date)} • {expense.payment_method}
                    </div>
                  </div>
                  <div className="text-[17px] font-bold text-[#ff3b30]" suppressHydrationWarning>
                    {formatCurrency(expense.amount)}
                  </div>
                </div>
              </TelegramCard>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

