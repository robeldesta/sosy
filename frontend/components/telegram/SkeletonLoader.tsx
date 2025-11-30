'use client'

interface SkeletonLoaderProps {
  width?: string
  height?: string
  className?: string
  rounded?: boolean
}

export function SkeletonLoader({ 
  width = '100%', 
  height = '20px', 
  className = '',
  rounded = false 
}: SkeletonLoaderProps) {
  return (
    <div
      className={`skeleton ${rounded ? 'rounded-full' : 'rounded-[8px]'} ${className}`}
      style={{ width, height }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-[#212121] rounded-[12px] p-[14px] space-y-[12px]">
      <SkeletonLoader height="20px" width="60%" />
      <SkeletonLoader height="16px" width="80%" />
      <SkeletonLoader height="16px" width="40%" />
    </div>
  )
}

export function SkeletonListItem() {
  return (
    <div className="bg-white dark:bg-[#212121] rounded-[12px] p-[14px]">
      <div className="flex items-center gap-[12px]">
        <SkeletonLoader width="40px" height="40px" rounded />
        <div className="flex-1 space-y-[8px]">
          <SkeletonLoader height="16px" width="70%" />
          <SkeletonLoader height="14px" width="50%" />
        </div>
      </div>
    </div>
  )
}

