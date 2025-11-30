'use client'

import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramInput } from '@/components/telegram/TelegramInput'
import { TelegramButton } from '@/components/telegram/TelegramButton'
import { BackButton } from '@/components/telegram/BackButton'
import { inviteApi, Invite } from '@/lib/api/invite'
import { branchApi, Branch } from '@/lib/api/branch'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useBackButton } from '@/hooks/useBackButton'
import { useMainButton } from '@/hooks/useMainButton'
import { useToastStore } from '@/stores/toastStore'

export default function CreateInvitePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { webApp } = useTelegramWebApp()
  const { addToast } = useToastStore()
  const [role, setRole] = useState<string>('staff')
  const [branchId, setBranchId] = useState<string>('')
  const [expiresInHours, setExpiresInHours] = useState<string>('24')
  const [branches, setBranches] = useState<Branch[]>([])
  const [creating, setCreating] = useState(false)
  const [createdInvite, setCreatedInvite] = useState<Invite | null>(null)

  useBackButton()

  useEffect(() => {
    loadBranches()
  }, [])

  const loadBranches = async () => {
    try {
      const data = await branchApi.listBranches()
      setBranches(data)
    } catch (error) {
      console.error('Failed to load branches:', error)
    }
  }

  const handleCreate = async () => {
    if (creating) return

    setCreating(true)
    try {
      const invite = await inviteApi.createInvite({
        role,
        branch_id: branchId ? parseInt(branchId) : undefined,
        expires_in_hours: parseInt(expiresInHours) || 24,
      })
      setCreatedInvite(invite)
      webApp?.HapticFeedback?.notificationOccurred('success')
    } catch (error: any) {
      webApp?.HapticFeedback?.notificationOccurred('error')
      addToast(
        error.response?.data?.detail || t('invite.createError'),
        'error'
      )
    } finally {
      setCreating(false)
    }
  }

  const copyCode = () => {
    if (createdInvite) {
      navigator.clipboard.writeText(createdInvite.code)
      webApp?.HapticFeedback?.notificationOccurred('success')
      addToast(t('invite.copied'), 'success')
    }
  }

  if (createdInvite) {
    return (
      <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] pb-[80px]">
        <div className="sticky top-0 z-10 bg-white dark:bg-[#212121] border-b border-[#e5e5e5] dark:border-[#3a3a3a]">
          <div className="flex items-center px-[14px] py-[12px]">
            <BackButton />
            <div className="flex-1">
              <h1 className="text-[20px] font-semibold leading-[24px]" suppressHydrationWarning>
                {t('invite.inviteCode')}
              </h1>
            </div>
          </div>
        </div>

        <div className="px-[14px] pt-[8px] space-y-[8px]">
          <TelegramCard>
            <div className="text-center py-[20px]">
              <div className="text-[32px] font-bold mb-[8px]" suppressHydrationWarning>
                {createdInvite.code}
              </div>
              <div className="text-[14px] text-[#707579] mb-[16px]" suppressHydrationWarning>
                {t(`invite.roles.${createdInvite.role}`)} • {t('invite.expiresIn')}: {createdInvite.expires_at ? new Date(createdInvite.expires_at).toLocaleString() : '24h'}
              </div>
              <TelegramButton variant="primary" onClick={copyCode}>
                {t('invite.copyCode')}
              </TelegramButton>
            </div>
          </TelegramCard>

          <TelegramCard>
            <div className="text-[14px] text-[#707579]" suppressHydrationWarning>
              {t('invite.shareInstructions')}
            </div>
          </TelegramCard>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] pb-[80px]">
      <div className="sticky top-0 z-10 bg-white dark:bg-[#212121] border-b border-[#e5e5e5] dark:border-[#3a3a3a]">
        <div className="flex items-center px-[14px] py-[12px]">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-[20px] font-semibold leading-[24px]" suppressHydrationWarning>
              {t('invite.createInvite')}
            </h1>
          </div>
        </div>
      </div>

      <div className="px-[14px] pt-[8px] space-y-[8px]">
        <TelegramCard>
          <label className="block text-[14px] text-[#707579] dark:text-[#707579] mb-[6px]" suppressHydrationWarning>
            {t('invite.role')}
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-[14px] py-[10px] text-[17px] bg-transparent border-b border-[#e5e5e5] dark:border-[#3a3a3a] focus:outline-none focus:border-[#3390ec] mb-[16px]"
          >
            <option value="staff">{t('staff.roles.staff')}</option>
            <option value="manager">{t('staff.roles.manager')}</option>
          </select>

          {branches.length > 0 && (
            <>
              <label className="block text-[14px] text-[#707579] dark:text-[#707579] mb-[6px]" suppressHydrationWarning>
                {t('branch.title')} ({t('common.optional')})
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-[14px] py-[10px] text-[17px] bg-transparent border-b border-[#e5e5e5] dark:border-[#3a3a3a] focus:outline-none focus:border-[#3390ec] mb-[16px]"
              >
                <option value="">{t('common.none')}</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </>
          )}

          <TelegramInput
            label={t('invite.expiresIn')}
            type="number"
            value={expiresInHours}
            onChange={setExpiresInHours}
            placeholder="24"
            className="mt-[8px]"
          />
        </TelegramCard>

        <TelegramButton
          variant="primary"
          fullWidth
          onClick={handleCreate}
          disabled={creating}
        >
          {creating ? t('common.saving') : t('invite.createInvite')}
        </TelegramButton>
      </div>
    </div>
  )
}

