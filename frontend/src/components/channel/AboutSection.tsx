import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Edit,
  Save,
  X,
  Calendar,
  Users,
  Video,
  Eye,
  Globe,
  Twitter,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Mail,
  MapPin
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { apiService } from '@/services/api'
import { QUERY_KEYS } from '@/types'
import Button from '@/components/ui/Button'
import { toast } from 'react-hot-toast'

interface AboutSectionProps {
  channelData: {
    fullName: string
    username: string
    description?: string
    createdAt: string
    subscribersCount: number
    totalVideos: number
    totalViews?: number
    socialLinks?: {
      website?: string
      twitter?: string
      instagram?: string
      facebook?: string
      linkedin?: string
      youtube?: string
    }
    businessEmail?: string
    location?: string
  }
  isOwnChannel: boolean
}

const AboutSection = ({ channelData, isOwnChannel }: AboutSectionProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    description: channelData.description || '',
    businessEmail: channelData.businessEmail || '',
    location: channelData.location || '',
    socialLinks: {
      website: channelData.socialLinks?.website || '',
      twitter: channelData.socialLinks?.twitter || '',
      instagram: channelData.socialLinks?.instagram || '',
      facebook: channelData.socialLinks?.facebook || '',
      linkedin: channelData.socialLinks?.linkedin || '',
      youtube: channelData.socialLinks?.youtube || ''
    }
  })

  const queryClient = useQueryClient()

  const updateChannelMutation = useMutation({
    mutationFn: (data: typeof formData) => apiService.updateChannelInfo(data),
    onSuccess: () => {
      toast.success('Channel information updated successfully!')
      // Invalidate and refetch channel data
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CHANNEL_VIDEOS, channelData.username] })
      setIsEditing(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update channel information')
    }
  })

  const handleSave = () => {
    updateChannelMutation.mutate(formData)
  }

  const handleCancel = () => {
    setFormData({
      description: channelData.description || '',
      businessEmail: channelData.businessEmail || '',
      location: channelData.location || '',
      socialLinks: {
        website: channelData.socialLinks?.website || '',
        twitter: channelData.socialLinks?.twitter || '',
        instagram: channelData.socialLinks?.instagram || '',
        facebook: channelData.socialLinks?.facebook || '',
        linkedin: channelData.socialLinks?.linkedin || '',
        youtube: channelData.socialLinks?.youtube || ''
      }
    })
    setIsEditing(false)
  }

  const socialPlatforms = [
    { key: 'website', label: 'Website', icon: Globe, placeholder: 'https://yourwebsite.com' },
    { key: 'twitter', label: 'Twitter', icon: Twitter, placeholder: 'https://twitter.com/username' },
    { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/username' },
    { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/username' },
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/username' },
    { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@username' }
  ]

  const stats = [
    { 
      icon: Users, 
      label: 'Subscribers', 
      value: channelData.subscribersCount?.toLocaleString() || '0',
      color: 'text-blue-600 dark:text-blue-400'
    },
    { 
      icon: Video, 
      label: 'Videos', 
      value: channelData.totalVideos?.toLocaleString() || '0',
      color: 'text-green-600 dark:text-green-400'
    },
    { 
      icon: Eye, 
      label: 'Total Views', 
      value: channelData.totalViews?.toLocaleString() || '0',
      color: 'text-purple-600 dark:text-purple-400'
    },
    { 
      icon: Calendar, 
      label: 'Joined', 
      value: formatDistanceToNow(new Date(channelData.createdAt), { addSuffix: true }),
      color: 'text-gray-600 dark:text-gray-400'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">About</h2>
        {isOwnChannel && (
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <Button
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={updateChannelMutation.isPending}
                  className="flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  loading={updateChannelMutation.isPending}
                  disabled={updateChannelMutation.isPending}
                  className="flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Channel</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Channel Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const IconComponent = stat.icon
          return (
            <div key={stat.label} className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 mb-3 ${stat.color}`}>
                <IconComponent className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
            </div>
          )
        })}
      </div>

      {/* Description */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Description</h3>
        {isEditing ? (
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
            placeholder="Tell viewers about your channel..."
            maxLength={1000}
          />
        ) : (
          <div className="text-gray-700 dark:text-gray-300">
            {channelData.description ? (
              <p className="whitespace-pre-wrap">{channelData.description}</p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">
                {isOwnChannel ? 'Add a description to tell viewers about your channel.' : 'No description available.'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Contact Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Contact Information</h3>
        <div className="space-y-4">
          {/* Business Email */}
          <div className="flex items-center space-x-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="email"
                  value={formData.businessEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessEmail: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="business@example.com"
                />
              ) : (
                <span className="text-gray-700 dark:text-gray-300">
                  {channelData.businessEmail || (isOwnChannel ? 'Add business email' : 'No business email')}
                </span>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center space-x-3">
            <MapPin className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="City, Country"
                />
              ) : (
                <span className="text-gray-700 dark:text-gray-300">
                  {channelData.location || (isOwnChannel ? 'Add location' : 'No location specified')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Social Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {socialPlatforms.map((platform) => {
            const IconComponent = platform.icon
            const value = formData.socialLinks[platform.key as keyof typeof formData.socialLinks]
            const displayValue = channelData.socialLinks?.[platform.key as keyof typeof channelData.socialLinks]

            return (
              <div key={platform.key} className="flex items-center space-x-3">
                <IconComponent className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  {isEditing ? (
                    <input
                      type="url"
                      value={value}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, [platform.key]: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder={platform.placeholder}
                    />
                  ) : displayValue ? (
                    <a
                      href={displayValue}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-primary hover:text-brand-secondary transition-colors"
                    >
                      {platform.label}
                    </a>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">
                      {isOwnChannel ? `Add ${platform.label} link` : `No ${platform.label} link`}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AboutSection
