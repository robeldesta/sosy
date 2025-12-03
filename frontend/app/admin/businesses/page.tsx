'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import { adminApi, Business } from '@/lib/api/admin'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramInput } from '@/components/telegram/TelegramInput'
import { SkeletonCard } from '@/components/telegram/SkeletonCard'
import { EmptyState } from '@/components/telegram/EmptyState'

export default function AdminBusinessesPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadBusinesses()
  }, [search])

  const loadBusinesses = async () => {
    try {
      setLoading(true)
      const data = await adminApi.getBusinesses(search || undefined)
      setBusinesses(data)
    } catch (error) {
      console.error('Failed to load businesses:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] pb-[80px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#212121] border-b border-[#e5e5e5] dark:border-[#3a3a3a]">
        <div className="px-[14px] py-[12px]">
          <h1 className="text-[20px] font-semibold leading-[24px]">Businesses</h1>
        </div>
      </div>

      {/* Search */}
      <div className="p-[14px]">
        <TelegramInput
          value={search}
          onChange={setSearch}
          placeholder="Search businesses..."
        />
      </div>

      {/* Business List */}
      <div className="px-[14px] space-y-[8px]">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : businesses.length === 0 ? (
          <EmptyState
            title="No businesses found"
            message={search ? "Try a different search term" : "No businesses registered yet"}
          />
        ) : (
          businesses.map((business) => (
            <TelegramCard
              key={business.id}
              onClick={() => router.push(`/admin/businesses/${business.id}`)}
            >
              <div className="p-[14px]">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-[17px] font-medium mb-[4px]">{business.name}</div>
                    {business.business_type && (
                      <div className="text-[14px] text-[#707579]">{business.business_type}</div>
                    )}
                    {business.location && (
                      <div className="text-[13px] text-[#707579] mt-[2px]">{business.location}</div>
                    )}
                  </div>
                  <div className="text-[13px] text-[#707579]">
                    {new Date(business.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </TelegramCard>
          ))
        )}
      </div>
    </div>
  )
}

