'use client'

import { useTranslation } from 'react-i18next'

interface TotalsBoxProps {
  subtotal: number
  tax: number
  total: number
}

export function TotalsBox({ subtotal, tax, total }: TotalsBoxProps) {
  const { t } = useTranslation()

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ETB`
  }

  return (
    <div className="bg-white dark:bg-[#212121] rounded-[12px] p-[12px] space-y-[8px]">
      <div className="flex justify-between items-center">
        <div className="text-[15px] text-[#707579]">{t('invoice.subtotal')}</div>
        <div className="text-[15px] font-medium">{formatCurrency(subtotal)}</div>
      </div>
      <div className="flex justify-between items-center">
        <div className="text-[15px] text-[#707579]">{t('invoice.tax')}</div>
        <div className="text-[15px] font-medium">{formatCurrency(tax)}</div>
      </div>
      <div className="border-t border-[#e5e5e5] dark:border-[#3a3a3a] pt-[8px] mt-[8px]">
        <div className="flex justify-between items-center">
          <div className="text-[17px] font-semibold">{t('invoice.total')}</div>
          <div className="text-[20px] font-bold">{formatCurrency(total)}</div>
        </div>
      </div>
    </div>
  )
}

