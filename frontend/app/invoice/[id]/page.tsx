'use client'

import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { invoiceApi } from '@/lib/api/invoice'
import { paymentApi, Payment } from '@/lib/api/payment'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramListItem } from '@/components/telegram/TelegramListItem'
import { TelegramButton } from '@/components/telegram/TelegramButton'
import { BackButton } from '@/components/telegram/BackButton'
import { PaymentModal } from '@/components/invoice/PaymentModal'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useBackButton } from '@/hooks/useBackButton'
import { useToastStore } from '@/stores/toastStore'

interface InvoiceItem {
  id: number
  invoice_id: number
  stock_item_id: number
  quantity: number
  unit_price: number
  total: number
}

interface Invoice {
  id: number
  invoice_number: string
  customer_name?: string
  customer_phone?: string
  items?: InvoiceItem[]
  subtotal: number
  tax: number
  total: number
  status: string
  created_at: string
}

export default function InvoiceDetailPage() {
  const { t } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const { user, webApp } = useTelegramWebApp()
  const { addToast } = useToastStore()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [markingPaid, setMarkingPaid] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentSummary, setPaymentSummary] = useState<{ total_paid: number; outstanding_balance: number } | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  useBackButton()

  useEffect(() => {
    if (params.id) {
      loadInvoice(Number(params.id))
    }
  }, [params.id])

  const loadInvoice = async (id: number) => {
    try {
      const data = await invoiceApi.getInvoice(id)
      setInvoice(data)
      
      // Load payments
      const paymentData = await paymentApi.getInvoicePayments(id)
      setPayments(paymentData)
      
      // Load payment summary
      const summary = await paymentApi.getInvoicePaymentSummary(id)
      setPaymentSummary({
        total_paid: summary.total_paid,
        outstanding_balance: summary.outstanding_balance,
      })
    } catch (error) {
      console.error('Failed to load invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsPaid = async () => {
    if (!invoice || markingPaid) return

    setMarkingPaid(true)
    try {
      await invoiceApi.markAsPaid(invoice.id)
      webApp?.HapticFeedback?.notificationOccurred('success')
      addToast(t('invoice.markedAsPaid'), 'success')
      await loadInvoice(invoice.id)
    } catch (error: any) {
      webApp?.HapticFeedback?.notificationOccurred('error')
      addToast(
        error.response?.data?.detail || t('invoice.markPaidError'),
        'error'
      )
    } finally {
      setMarkingPaid(false)
    }
  }

  const handleDownloadPDF = () => {
    if (!invoice) return
    const pdfUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/invoice/${invoice.id}/pdf`
    window.open(pdfUrl, '_blank')
    webApp?.HapticFeedback?.impactOccurred('light')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ETB`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] flex items-center justify-center">
        <div className="text-[#707579] text-[15px]">{t('common.loading')}</div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] flex items-center justify-center px-[20px]">
        <div className="text-center">
          <div className="text-[#707579] text-[15px] mb-[16px]">
            {t('invoice.notFound')}
          </div>
          <button
            onClick={() => router.back()}
            className="rounded-full bg-[#3390ec] text-white px-[20px] py-[10px] text-[17px] font-medium"
          >
            {t('common.back')}
          </button>
        </div>
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
            <h1 className="text-[20px] font-semibold leading-[24px]">
              {invoice.invoice_number}
            </h1>
            {user?.first_name && (
              <div className="text-[14px] text-[#707579] mt-[2px]">
                {user.first_name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-[14px] pt-[8px] space-y-[8px]">
        {/* Status */}
        <TelegramCard>
          <div className="flex justify-between items-center">
            <div className="text-[15px] text-[#707579]">{t('invoice.status')}</div>
            <span className={`text-[14px] px-[8px] py-[4px] rounded-full font-medium ${
              invoice.status === 'paid' 
                ? 'bg-[#34c759] text-white' 
                : invoice.status === 'draft'
                ? 'bg-[#707579] text-white'
                : 'bg-[#ff9500] text-white'
            }`}>
              {invoice.status}
            </span>
          </div>
        </TelegramCard>

        {/* Customer Info */}
        <TelegramCard>
          <div className="text-[17px] font-medium mb-[12px]">{t('invoice.customer')}</div>
          <TelegramListItem
            title={invoice.customer_name || t('invoice.noCustomer')}
            subtitle={invoice.customer_phone || t('invoice.noPhone')}
          />
        </TelegramCard>

        {/* Items */}
        {invoice.items && invoice.items.length > 0 && (
          <TelegramCard>
            <div className="text-[17px] font-medium mb-[12px]">{t('invoice.items')}</div>
            <div className="space-y-[12px]">
              {invoice.items.map((item, index) => (
                <div key={item.id || index} className="border-b border-[#e5e5e5] dark:border-[#3a3a3a] pb-[12px] last:border-0">
                  <div className="flex justify-between items-start mb-[4px]">
                    <div className="text-[15px] font-medium">
                      {t('invoice.item')} #{index + 1}
                    </div>
                    <div className="text-[15px] font-medium">
                      {formatCurrency(item.total)}
                    </div>
                  </div>
                  <div className="text-[14px] text-[#707579]">
                    {item.quantity} × {formatCurrency(item.unit_price)}
                  </div>
                </div>
              ))}
            </div>
          </TelegramCard>
        )}

        {/* Payment Summary */}
        {paymentSummary && (
          <TelegramCard>
            <div className="space-y-[8px]">
              <div className="flex justify-between items-center">
                <div className="text-[15px] text-[#707579]">{t('payment.totalPaid')}</div>
                <div className="text-[15px] font-medium">{formatCurrency(paymentSummary.total_paid)}</div>
              </div>
              {paymentSummary.outstanding_balance > 0 && (
                <div className="flex justify-between items-center">
                  <div className="text-[15px] text-[#707579]">{t('payment.outstandingBalance')}</div>
                  <div className="text-[15px] font-medium text-[#ff3b30]">
                    {formatCurrency(paymentSummary.outstanding_balance)}
                  </div>
                </div>
              )}
            </div>
          </TelegramCard>
        )}

        {/* Totals */}
        <TelegramCard>
          <div className="space-y-[8px]">
            <div className="flex justify-between items-center">
              <div className="text-[15px] text-[#707579]">{t('invoice.subtotal')}</div>
              <div className="text-[15px]">{formatCurrency(invoice.subtotal)}</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-[15px] text-[#707579]">{t('invoice.tax')}</div>
              <div className="text-[15px]">{formatCurrency(invoice.tax)}</div>
            </div>
            <div className="border-t border-[#e5e5e5] dark:border-[#3a3a3a] pt-[8px] mt-[8px]">
              <div className="flex justify-between items-center">
                <div className="text-[17px] font-semibold">{t('invoice.total')}</div>
                <div className="text-[20px] font-bold">{formatCurrency(invoice.total)}</div>
              </div>
            </div>
          </div>
        </TelegramCard>

        {/* Payment History */}
        {payments.length > 0 && (
          <TelegramCard>
            <div className="text-[17px] font-medium mb-[12px]" suppressHydrationWarning>
              {t('payment.history')}
            </div>
            <div className="space-y-[8px]">
              {payments.map((payment) => (
                <div key={payment.id} className="border-b border-[#e5e5e5] dark:border-[#3a3a3a] pb-[8px] last:border-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-[15px] font-medium" suppressHydrationWarning>
                        {formatCurrency(payment.amount)} - {payment.payment_method}
                      </div>
                      <div className="text-[13px] text-[#707579]" suppressHydrationWarning>
                        {formatDate(payment.payment_date)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TelegramCard>
        )}

        {/* Date */}
        <TelegramCard>
          <div className="text-[14px] text-[#707579]">
            {t('invoice.createdAt')}: {formatDate(invoice.created_at)}
          </div>
        </TelegramCard>

        {/* Actions */}
        <div className="space-y-[8px] pt-[8px]">
          <TelegramButton
            variant="primary"
            fullWidth
            onClick={handleDownloadPDF}
          >
            {t('invoice.downloadPDF')}
          </TelegramButton>
          
          {paymentSummary && paymentSummary.outstanding_balance > 0 && (
            <TelegramButton
              variant="primary"
              fullWidth
              onClick={() => setShowPaymentModal(true)}
            >
              {t('payment.recordPayment')}
            </TelegramButton>
          )}
          
          {invoice.status !== 'paid' && paymentSummary?.outstanding_balance === 0 && (
            <TelegramButton
              variant="secondary"
              fullWidth
              onClick={handleMarkAsPaid}
              disabled={markingPaid}
            >
              {markingPaid ? t('common.saving') : t('invoice.markAsPaid')}
            </TelegramButton>
          )}
        </div>

        {/* Payment Modal */}
        {showPaymentModal && paymentSummary && (
          <PaymentModal
            invoiceId={invoice.id}
            outstandingBalance={paymentSummary.outstanding_balance}
            onClose={() => setShowPaymentModal(false)}
            onSuccess={() => {
              loadInvoice(invoice.id)
              addToast(t('payment.recorded'), 'success')
            }}
          />
        )}
      </div>
    </div>
  )
}
