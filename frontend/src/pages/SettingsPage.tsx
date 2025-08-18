import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera, Upload, Save, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'
import CoverImageUploadModal from '@/components/ui/CoverImageUploadModal'
import { validateFileType, validateFileSize } from '@/utils'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

const SettingsPage = () => {
  const { user, updateProfile, updateAvatar, updateCoverImage, changePassword } = useAuthStore()
  const { theme, toggleTheme } = useAppStore()
  const [activeTab, setActiveTab] = useState<'profile' | 'account'>('profile')
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [showCoverUploadModal, setShowCoverUploadModal] = useState(false)
  const [isUploadingCover, setIsUploadingCover] = useState(false)



  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
    },
  })

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        fullName: user.fullName || '',
      })
    }
  }, [user, profileForm])



  const handleProfileSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile({ fullName: data.fullName, email: user?.email || '' })
      // Reset form with updated values after successful update
      profileForm.reset({
        fullName: data.fullName,
      })
    } catch (error) {
      console.error('Profile update failed:', error)
    }
  }

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    try {
      await changePassword(data.currentPassword, data.newPassword)
      passwordForm.reset()
    } catch (error) {
      console.error('Password change failed:', error)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!validateFileType(file, ['image/jpeg', 'image/png', 'image/webp'])) {
      alert('Please select a valid image file (JPEG, PNG, or WebP)')
      return
    }

    if (!validateFileSize(file, 5)) {
      alert('Image size must be less than 5MB')
      return
    }

    try {
      await updateAvatar(file)
    } catch (error) {
      console.error('Avatar update failed:', error)
    }
  }

  const handleCoverImageUpload = async (file: File) => {
    setIsUploadingCover(true)
    try {
      await updateCoverImage(file)
    } catch (error) {
      console.error('Cover image update failed:', error)
      throw error
    } finally {
      setIsUploadingCover(false)
    }
  }

  const tabs = [
    { id: 'profile' as const, label: 'Profile' },
    { id: 'account' as const, label: 'Account' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Cover Image */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Cover Image
                </h3>
              </div>
              <div className="card-content">
                <div className="relative group">
                  <div className="h-32 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-lg overflow-hidden">
                    {user?.coverImage && (
                      <img
                        src={user.coverImage}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center rounded-lg">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-2 bg-black bg-opacity-75 hover:bg-opacity-90 text-white border-none"
                      onClick={() => setShowCoverUploadModal(true)}
                      type="button"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Change Cover</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Avatar and Basic Info */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Profile Information
                </h3>
              </div>
              <div className="card-content">
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <Avatar
                        src={user?.avatar}
                        name={user?.fullName}
                        size="xl"
                      />
                      <label className="absolute bottom-0 right-0 cursor-pointer">
                        <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center text-white hover:bg-brand-secondary transition-colors">
                          <Upload className="w-4 h-4" />
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleAvatarChange}
                        />
                      </label>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        Profile Picture
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Upload a new profile picture. Recommended size: 400x400px
                      </p>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Full Name"
                      {...profileForm.register('fullName')}
                      error={profileForm.formState.errors.fullName?.message}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      loading={profileForm.formState.isSubmitting}
                      className="flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="space-y-6">
            {/* Change Password */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Change Password
                </h3>
              </div>
              <div className="card-content">
                <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                  <div className="relative">
                    <Input
                      label="Current Password"
                      type={showPasswords.current ? 'text' : 'password'}
                      {...passwordForm.register('currentPassword')}
                      error={passwordForm.formState.errors.currentPassword?.message}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="relative">
                    <Input
                      label="New Password"
                      type={showPasswords.new ? 'text' : 'password'}
                      {...passwordForm.register('newPassword')}
                      error={passwordForm.formState.errors.newPassword?.message}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="relative">
                    <Input
                      label="Confirm New Password"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      {...passwordForm.register('confirmPassword')}
                      error={passwordForm.formState.errors.confirmPassword?.message}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      loading={passwordForm.formState.isSubmitting}
                    >
                      Update Password
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            {/* Theme Settings */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Appearance
                </h3>
              </div>
              <div className="card-content">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Theme</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Choose your preferred theme
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={toggleTheme}
                    className="flex items-center space-x-2"
                  >
                    <span>{theme === 'dark' ? 'Dark' : 'Light'} Mode</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}


      </div>

      {/* Cover Image Upload Modal */}
      <CoverImageUploadModal
        isOpen={showCoverUploadModal}
        onClose={() => setShowCoverUploadModal(false)}
        onUpload={handleCoverImageUpload}
        currentImage={user?.coverImage}
        isUploading={isUploadingCover}
      />
    </div>
  )
}

export default SettingsPage
