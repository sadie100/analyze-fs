'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

interface SearchBarProps {
  defaultValue?: string
  onSearch?: (term: string) => void
  placeholder?: string
  buttonLabel?: string
  isLoading?: boolean
}

const SearchBar: React.FC<SearchBarProps> = ({
  defaultValue = '',
  onSearch,
  placeholder = '회사명을 입력하세요 (예: 삼성전자, LG화학)',
  buttonLabel = '분석',
  isLoading = false,
}) => {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const triggerSearch = useCallback(
    (term: string) => {
      if (!term) return
      if (onSearch) onSearch(term)
      else router.push(`/result?company=${encodeURIComponent(term)}`)
    },
    [onSearch, router]
  )

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 1) {
      setSuggestions([])
      return
    }
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&type=suggestions&limit=5`
      )
      const result = await response.json()
      setSuggestions(result.suggestions || [])
    } catch (error) {
      console.error('자동완성 오류:', error)
      setSuggestions([])
    }
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(searchTerm)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm, fetchSuggestions])

  useEffect(() => {
    setSearchTerm(defaultValue)
  }, [defaultValue])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      triggerSearch(searchTerm)
      setShowSuggestions(false)
    }
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder={placeholder}
            value={searchTerm}
            disabled={isLoading}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setShowSuggestions(true)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => {
                    setSearchTerm(suggestion)
                    setShowSuggestions(false)
                    triggerSearch(suggestion)
                  }}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
        <Button
          onClick={() => {
            triggerSearch(searchTerm)
            setShowSuggestions(false)
          }}
          disabled={!searchTerm || isLoading}
        >
          <Search className="h-4 w-4 mr-2" />
          {buttonLabel}
        </Button>
      </div>
    </div>
  )
}

export default SearchBar
