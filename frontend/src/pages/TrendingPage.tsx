import React from 'react'
import { TrendingUp, AlertCircle } from 'lucide-react'

const TrendingPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <TrendingUp className="w-8 h-8 text-brand-primary" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Testing - Trending
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Discover what's popular and trending right now
        </p>
      </div>

      {/* Disabled Functionality Notice */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              Trending Feature Temporarily Disabled
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300 mb-4">
              The trending functionality is currently under development and has been temporarily disabled. 
              We're working on improving the trending algorithm to provide you with the most relevant and 
              popular content.
            </p>
            <div className="text-sm text-yellow-600 dark:text-yellow-400">
              <p className="font-medium mb-1">What we're working on:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Enhanced trending algorithm based on view velocity</li>
                <li>Category-specific trending (Music, Gaming, News, etc.)</li>
                <li>Regional trending content</li>
                <li>Real-time trending updates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="text-center py-16">
        <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <TrendingUp className="w-16 h-16 text-gray-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Trending Content Coming Soon
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8">
          We're preparing an amazing trending experience for you. In the meantime, 
          explore our other features like subscriptions, playlists, and search.
        </p>

        {/* Alternative Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-brand-primary hover:bg-brand-secondary transition-colors"
          >
            Explore Home
          </a>
          
          <a
            href="/subscriptions"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            View Subscriptions
          </a>
        </div>
      </div>

      {/* Additional Information */}
      <div className="mt-16 border-t border-gray-200 dark:border-gray-700 pt-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Smart Algorithm
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Our trending algorithm will analyze view patterns, engagement rates, and user interactions to surface the most relevant content.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Real-time Updates
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Trending content will be updated in real-time to ensure you always see the freshest and most popular videos.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Personalized Trends
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Get trending content tailored to your interests and viewing history for a more personalized experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrendingPage
