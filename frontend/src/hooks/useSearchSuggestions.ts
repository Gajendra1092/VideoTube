import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '@/services/api'
import { QUERY_KEYS, SearchSuggestion, SearchSuggestionsResponse, ApiResponse } from '@/types'

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
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  const suggestions: SearchSuggestion[] = (suggestionsData as ApiResponse<SearchSuggestionsResponse>)?.data?.suggestions || []

  return {
    suggestions,
    isLoading,
    error,
    hasQuery: debouncedQuery.trim().length > 0
  }
}
