import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '@/services/api'
import { QUERY_KEYS } from '@/types'

interface SearchSuggestion {
  text: string
  type: 'video' | 'channel'
}

interface UseSearchSuggestionsOptions {
  enabled?: boolean
  debounceMs?: number
  maxSuggestions?: number
}

export const useSearchSuggestions = (
  query: string,
  options: UseSearchSuggestionsOptions = {}
) => {
  const {
    enabled = true,
    debounceMs = 300,
    maxSuggestions = 10
  } = options

  const [debouncedQuery, setDebouncedQuery] = useState(query)

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, debounceMs])

  // Fetch suggestions
  const {
    data: suggestionsData,
    isLoading,
    error
  } = useQuery({
    queryKey: [QUERY_KEYS.SEARCH, 'suggestions', debouncedQuery],
    queryFn: () => apiService.getSearchSuggestions({
      q: debouncedQuery,
      limit: maxSuggestions
    }),
    enabled: enabled && debouncedQuery.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })

  const suggestions: SearchSuggestion[] = suggestionsData?.data?.suggestions || []

  return {
    suggestions,
    isLoading,
    error,
    hasQuery: debouncedQuery.trim().length > 0
  }
}
