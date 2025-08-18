import { cn } from '@/utils'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
}

const Skeleton = ({ 
  className, 
  variant = 'rectangular', 
  width, 
  height 
}: SkeletonProps) => {
  const baseClasses = 'skeleton'
  
  const variantClasses = {
    text: 'h-4',
    circular: 'rounded-full',
    rectangular: 'rounded',
  }

  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      style={style}
    />
  )
}

// Skeleton components for common use cases
export const VideoCardSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="aspect-video w-full" />
    <div className="flex space-x-3">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  </div>
)

export const CommentSkeleton = () => (
  <div className="flex space-x-3">
    <Skeleton variant="circular" width={32} height={32} />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  </div>
)

export const ChannelHeaderSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-32 md:h-48 w-full rounded-lg" />
    <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6">
      <Skeleton variant="circular" width={80} height={80} className="md:w-32 md:h-32" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="flex space-x-3">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  </div>
)

export default Skeleton
