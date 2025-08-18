import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils'
import LoadingSpinner from './LoadingSpinner'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    const baseClasses = 'btn focus-ring'
    
    const variantClasses = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      ghost: 'btn-ghost',
      outline: 'border hover:bg-opacity-10',
      danger: 'btn-primary' // Uses same styling as primary for red color
    }

    const sizeClasses = {
      sm: 'btn-sm',
      md: 'btn-md',
      lg: 'btn-lg'
    }

    return (
      <button
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          loading && 'opacity-75 cursor-not-allowed',
          className
        )}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading && (
          <LoadingSpinner size="sm" className="mr-2" />
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
