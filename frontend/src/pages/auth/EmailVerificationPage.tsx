import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'

const EmailVerificationPage = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { verifyEmail, resendVerificationEmail, user } = useAuthStore()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>('verifying')
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    if (token) {
      handleVerification(token)
    } else {
      setStatus('error')
    }
  }, [token])

  const handleVerification = async (verificationToken: string) => {
    try {
      await verifyEmail(verificationToken)
      setStatus('success')
      
      // Redirect to home after 3 seconds
      setTimeout(() => {
        navigate('/')
      }, 3000)
    } catch (error: any) {
      console.error('Email verification error:', error)
      if (error.message?.includes('expired') || error.message?.includes('invalid')) {
        setStatus('expired')
      } else {
        setStatus('error')
      }
    }
  }

  const handleResendEmail = async () => {
    if (!user?.email) return
    
    setIsResending(true)
    try {
      await resendVerificationEmail(user.email)
    } catch (error) {
      console.error('Resend email error:', error)
    } finally {
      setIsResending(false)
    }
  }

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin" style={{ color: 'var(--accent-secondary)' }} />
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Verifying your email...
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Please wait while we verify your email address.
            </p>
          </div>
        )

      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--accent-secondary)' }} />
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Email verified successfully!
            </h2>
            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
              Your email has been verified. You will be redirected to the home page shortly.
            </p>
            <Button onClick={() => navigate('/')}>
              Go to Home
            </Button>
          </div>
        )

      case 'expired':
        return (
          <div className="text-center">
            <Mail className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--accent-primary)' }} />
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Verification link expired
            </h2>
            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
              Your verification link has expired. Please request a new verification email.
            </p>
            {user?.email && (
              <Button 
                onClick={handleResendEmail}
                loading={isResending}
                className="mb-4"
              >
                Resend verification email
              </Button>
            )}
            <div>
              <Link 
                to="/auth/login" 
                className="text-sm"
                style={{ color: 'var(--accent-secondary)' }}
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        )

      case 'error':
      default:
        return (
          <div className="text-center">
            <XCircle className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--accent-primary)' }} />
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Verification failed
            </h2>
            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
              We couldn't verify your email address. The link may be invalid or expired.
            </p>
            {user?.email && (
              <Button 
                onClick={handleResendEmail}
                loading={isResending}
                className="mb-4"
              >
                Resend verification email
              </Button>
            )}
            <div>
              <Link 
                to="/auth/login" 
                className="text-sm"
                style={{ color: 'var(--accent-secondary)' }}
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-md w-full">
        <div className="p-8 rounded-lg border" style={{ 
          backgroundColor: 'var(--bg-surface)', 
          borderColor: 'var(--border-primary)' 
        }}>
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default EmailVerificationPage
