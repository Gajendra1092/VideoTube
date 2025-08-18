import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import GoogleOAuthButton from '@/components/auth/GoogleOAuthButton'

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)

  const from = location.state?.from?.pathname || '/'

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      // Determine if input is email or username
      const isEmail = data.emailOrUsername.includes('@')
      const credentials = {
        [isEmail ? 'email' : 'username']: data.emailOrUsername,
        password: data.password,
      }

      await login(credentials)
      navigate(from, { replace: true })
    } catch (error: any) {
      // Always show "Invalid credentials" for any authentication failure
      setError('root', {
        message: 'Invalid credentials',
      })
    }
  }



  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Welcome back! Please enter your details.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email or Username"
          type="text"
          autoComplete="username"
          {...register('emailOrUsername')}
          error={errors.emailOrUsername?.message}
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
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

        {errors.root && (
          <div className="text-sm text-red-600 dark:text-red-400">
            {errors.root.message}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          loading={isLoading}
        >
          Sign In
        </Button>
      </form>

      <div className="relative">
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
        text="signin_with"
        onSuccess={() => console.log('Google login successful')}
        onError={(error) => console.error('Google login error:', error)}
      />

      <div className="text-center">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link
            to="/auth/register"
            className="font-medium hover:underline"
            style={{ color: 'var(--accent-secondary)' }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
