import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Upload, Check, X, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import GoogleOAuthButton from '@/components/auth/GoogleOAuthButton'
import { validateFileType, validateFileSize } from '@/utils'
import { apiService } from '@/services/api'

// Simple debounce function
const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RegisterFormData = z.infer<typeof registerSchema>

const RegisterPage = () => {
  const navigate = useNavigate()
  const { register: registerUser, isLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [avatar, setAvatar] = useState<File | null>(null)
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)

  // Username availability state
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const watchedUsername = watch('username')

  // Debounced username availability check
  const checkUsernameAvailability = useCallback(
    debounce(async (username: string) => {
      if (!username || username.length < 3) {
        setUsernameStatus('idle')
        setShowSuggestions(false)
        return
      }

      setIsCheckingUsername(true)
      setUsernameStatus('checking')

      try {
        const response = await apiService.checkUsernameAvailability(username)

        if (response.data?.available) {
          setUsernameStatus('available')
          setShowSuggestions(false)
        } else {
          setUsernameStatus('taken')
          // Get username suggestions
          const suggestionsResponse = await apiService.getUsernameSuggestions(username)
          if (suggestionsResponse.data?.suggestions) {
            setUsernameSuggestions(suggestionsResponse.data.suggestions)
            setShowSuggestions(true)
          }
        }
      } catch (error) {
        console.error('Username check error:', error)
        setUsernameStatus('idle')
        setShowSuggestions(false)
      } finally {
        setIsCheckingUsername(false)
      }
    }, 500),
    []
  )

  // Watch username changes and check availability
  useEffect(() => {
    if (watchedUsername) {
      checkUsernameAvailability(watchedUsername)
    } else {
      setUsernameStatus('idle')
      setShowSuggestions(false)
    }
  }, [watchedUsername, checkUsernameAvailability])

  const handleSuggestionSelect = (suggestion: string) => {
    setValue('username', suggestion)
    setShowSuggestions(false)
    setUsernameStatus('available')
  }

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'avatar' | 'coverImage'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!validateFileType(file, ['image/jpeg', 'image/png', 'image/webp'])) {
      setError('root', { message: 'Please select a valid image file (JPEG, PNG, or WebP)' })
      return
    }

    // Validate file size (5MB)
    if (!validateFileSize(file, 5)) {
      setError('root', { message: 'Image size must be less than 5MB' })
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (type === 'avatar') {
        setAvatarPreview(result)
        setAvatar(file)
      } else {
        setCoverImagePreview(result)
        setCoverImage(file)
      }
    }
    reader.readAsDataURL(file)
  }

  const onSubmit = async (data: RegisterFormData) => {
    if (!avatar) {
      setError('root', { message: 'Avatar image is required' })
      return
    }

    // Check if username is available before submitting
    if (usernameStatus === 'taken') {
      setError('username', { message: 'Username already exists. Please choose another.' })
      return
    }

    if (usernameStatus === 'checking' || isCheckingUsername) {
      setError('username', { message: 'Please wait while we check username availability.' })
      return
    }

    try {
      const registerData = {
        fullName: data.fullName,
        email: data.email,
        username: data.username,
        password: data.password,
        avatar,
        coverImage: coverImage || undefined,
      }

      await registerUser(registerData)
      navigate('/');
    } catch (error: any) {
      let errorMessage = error.message || 'Registration failed. Please try again.';

      // Handle specific error types with helpful guidance
      if (errorMessage.includes('email address already exists')) {
        errorMessage = 'An account with this email address already exists. Please use a different email or sign in to your existing account.';
      } else if (errorMessage.includes('username is already taken')) {
        errorMessage = 'This username is already taken. Please choose a different username.';
      } else if (errorMessage.includes('User already exists')) {
        errorMessage = 'A user with this email or username already exists. Please try different credentials.';
      }

      setError('root', {
        message: errorMessage,
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Join VideoTube and start sharing your videos
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          autoComplete="name"
          {...register('fullName')}
          error={errors.fullName?.message}
        />

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          {...register('email')}
          error={errors.email?.message}
        />

        <div className="relative">
          <Input
            label="Username"
            type="text"
            autoComplete="username"
            {...register('username')}
            error={errors.username?.message || (usernameStatus === 'taken' ? 'Username already exists. Please choose another.' : '')}
            helperText="This will be your unique identifier on VideoTube"
          />

          {/* Username status indicator */}
          {watchedUsername && watchedUsername.length >= 3 && (
            <div className="absolute right-3 top-9 flex items-center">
              {isCheckingUsername && (
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--text-secondary)' }} />
              )}
              {!isCheckingUsername && usernameStatus === 'available' && (
                <Check className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
              )}
              {!isCheckingUsername && usernameStatus === 'taken' && (
                <X className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              )}
            </div>
          )}

          {/* Username suggestions */}
          {showSuggestions && usernameSuggestions.length > 0 && (
            <div className="mt-2 p-3 rounded-lg border" style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-primary)'
            }}>
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Suggested usernames:
              </p>
              <div className="flex flex-wrap gap-2">
                {usernameSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="px-3 py-1 text-sm rounded-md transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-hover)',
                      color: 'var(--accent-secondary)',
                      border: '1px solid var(--border-primary)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--accent-secondary)'
                      e.currentTarget.style.color = 'white'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                      e.currentTarget.style.color = 'var(--accent-secondary)'
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            {...register('password')}
            error={errors.password?.message}
          />
          <button
            type="button"
            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="relative">
          <Input
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />
          <button
            type="button"
            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Avatar Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Avatar Image *
          </label>
          <div className="flex items-center space-x-4">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar preview"
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <Upload className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <label className="cursor-pointer">
              <span className="btn btn-secondary btn-sm">
                Choose Avatar
              </span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'avatar')}
              />
            </label>
          </div>
        </div>

        {/* Cover Image Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Cover Image (Optional)
          </label>
          <div className="space-y-2">
            {coverImagePreview ? (
              <img
                src={coverImagePreview}
                alt="Cover preview"
                className="w-full h-32 rounded-lg object-cover"
              />
            ) : (
              <div className="w-full h-32 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <label className="cursor-pointer">
              <span className="btn btn-secondary btn-sm">
                Choose Cover Image
              </span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'coverImage')}
              />
            </label>
          </div>
        </div>

        {errors.root && (
          <div className="text-sm p-3 rounded-md border" style={{
            color: 'var(--accent-primary)',
            backgroundColor: 'var(--bg-hover)',
            borderColor: 'var(--accent-primary)'
          }}>
            <strong>Error:</strong> {errors.root.message}
            {errors.root.message.includes('email address already exists') && (
              <div className="mt-2">
                <Link
                  to="/auth/login"
                  className="text-sm font-medium hover:underline"
                  style={{ color: 'var(--accent-secondary)' }}
                >
                  Sign in to your existing account →
                </Link>
              </div>
            )}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          loading={isLoading}
        >
          Create Account
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" style={{ borderColor: 'var(--border-primary)' }} />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 text-sm" style={{
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-secondary)'
          }}>
            Or continue with
          </span>
        </div>
      </div>

      <GoogleOAuthButton
        text="signup_with"
        onSuccess={() => {
          navigate('/');
        }}
        onError={(error) => {
          setError('root', {
            message: 'Google sign-up failed. Please try again.',
          });
        }}
      />



      <div className="text-center mt-6">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link
            to="/auth/login"
            className="font-medium hover:underline"
            style={{ color: 'var(--accent-secondary)' }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
