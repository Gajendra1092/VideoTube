import { useState } from 'react'
import { cn, generateAvatarColor, ensureHttpsUrl } from '@/utils'

interface AvatarProps {
  src?: string
  alt?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
  onClick?: () => void
}

const Avatar = ({ src, alt, name = '', size = 'md', className, onClick }: AvatarProps) => {
  const [imageError, setImageError] = useState(false)

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-20 h-20 text-2xl'
  }

  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const avatarColor = generateAvatarColor(name)

  if (src && !imageError) {
    return (
      <img
        src={ensureHttpsUrl(src)}
        alt={alt || name}
        className={cn(
          'rounded-full object-cover',
          sizeClasses[size],
          onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
          className
        )}
        onError={() => setImageError(true)}
        onClick={onClick}
      />
    )
  }

  return (
    <div
      className={cn(
        'avatar-placeholder rounded-full',
        sizeClasses[size],
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      style={{ backgroundColor: avatarColor }}
      onClick={onClick}
    >
      {initials || '?'}
    </div>
  )
}

export default Avatar
