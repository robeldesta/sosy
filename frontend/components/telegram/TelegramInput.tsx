'use client'

import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'

interface TelegramInputProps {
  label?: string
  value: string | number
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'number' | 'tel' | 'email'
  required?: boolean
  error?: string
  className?: string
}

export function TelegramInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  error,
  className = '',
}: TelegramInputProps) {
  const { themeParams } = useTelegramWebApp()

  return (
    <div className={`mb-[16px] ${className}`}>
      {label && (
        <label className="block text-[14px] text-[#707579] dark:text-[#707579] mb-[6px]">
          {label}
          {required && <span className="text-[#ff3b30] ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`
          w-full
          px-[14px] py-[10px]
          text-[17px]
          bg-transparent
          border-b border-[#e5e5e5] dark:border-[#3a3a3a]
          focus:outline-none focus:border-[#3390ec]
          transition-colors
          ${error ? 'border-[#ff3b30]' : ''}
        `}
        style={{
          color: themeParams.text_color || undefined,
        }}
      />
      {error && (
        <div className="text-[14px] text-[#ff3b30] mt-[4px]">
          {error}
        </div>
      )}
    </div>
  )
}

