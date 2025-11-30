'use client'

import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supplierApi, Supplier } from '@/lib/api/supplier'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramListItem } from '@/components/telegram/TelegramListItem'
import { BackButton } from '@/components/telegram/BackButton'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useBackButton } from '@/hooks/useBackButton'

export default function SupplierDetailPage() {
  const { t } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const { user } = useTelegramWebApp()
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(true)

  useBackButton()

  useEffect(() => {
    if (params.id) {
      loadSupplier(Number(params.id))
    }
  }, [params.id])

  const loadSupplier = async (id: number) => {
    try {
      const data = await supplierApi.getSupplier(id)
      setSupplier(data)
    } catch (error) {
      console.error('Failed to load supplier:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] flex items-center justify-center">
        <div className="text-[#707579] text-[15px]">{t('common.loading')}</div>
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] flex items-center justify-center px-[20px]">
        <div className="text-center">
          <div className="text-[#707579] text-[15px] mb-[16px]">
            {t('supplier.notFound')}
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
              {supplier.name}
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
        <TelegramCard>
          <TelegramListItem
            title={t('supplier.phone')}
            subtitle={supplier.phone || t('invoice.noPhone')}
          />
        </TelegramCard>

        {supplier.address && (
          <TelegramCard>
            <TelegramListItem
              title={t('supplier.address')}
              subtitle={supplier.address}
            />
          </TelegramCard>
        )}

        {supplier.notes && (
          <TelegramCard>
            <div className="text-[17px] font-medium mb-[8px]">{t('supplier.notes')}</div>
            <div className="text-[15px] text-[#707579]">{supplier.notes}</div>
          </TelegramCard>
        )}
      </div>
    </div>
  )
}


