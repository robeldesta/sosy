'use client'

import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupplierStore } from '@/stores/supplierStore'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramListItem } from '@/components/telegram/TelegramListItem'
import { TelegramButton } from '@/components/telegram/TelegramButton'
import { BackButton } from '@/components/telegram/BackButton'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useBackButton } from '@/hooks/useBackButton'
import Link from 'next/link'

export default function SuppliersPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user } = useTelegramWebApp()
  const { suppliers, loading, fetchSuppliers } = useSupplierStore()

  useBackButton()

  useEffect(() => {
    fetchSuppliers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] pb-[80px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#212121] border-b border-[#e5e5e5] dark:border-[#3a3a3a]">
        <div className="flex items-center px-[14px] py-[12px]">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-[20px] font-semibold leading-[24px]">
              {t('supplier.title')}
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
      <div className="px-[14px] pt-[8px]">
        {/* Create Button */}
        <Link href="/suppliers/new" className="block mb-[12px]">
          <TelegramButton variant="primary" fullWidth>
            {t('supplier.addSupplier')}
          </TelegramButton>
        </Link>

        {/* Supplier List */}
        {loading ? (
          <div className="flex justify-center items-center py-[40px]">
            <div className="text-[#707579] text-[15px]">{t('common.loading')}</div>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-[60px] px-[20px]">
            <div className="text-[#707579] text-[15px] mb-[16px]">
              {t('supplier.noSuppliers')}
            </div>
            <Link href="/suppliers/new">
              <TelegramButton variant="primary">
                {t('supplier.createFirst')}
              </TelegramButton>
            </Link>
          </div>
        ) : (
          <div className="space-y-[8px]">
            {suppliers.map((supplier) => (
              <Link key={supplier.id} href={`/suppliers/${supplier.id}`}>
                <TelegramCard>
                  <TelegramListItem
                    title={supplier.name}
                    subtitle={supplier.phone || supplier.address || t('supplier.noSuppliers')}
                  />
                </TelegramCard>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


