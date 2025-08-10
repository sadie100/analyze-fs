'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { useSearchIndex } from '@/app/providers/SearchIndexProvider'

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
  const { companyNames, loading } = useSearchIndex()
  const [searchTerm, setSearchTerm] = useState(defaultValue)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const triggerSearch = useCallback(
    (term: string) => {
      if (!term) return
      if (onSearch) onSearch(term)
      else router.push(`/result?company=${encodeURIComponent(term)}`)
    },
    [onSearch, router]
  )

  const suggestions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return []
    const starts = companyNames.filter((n) => n.toLowerCase().startsWith(q))
    const inc = companyNames.filter(
      (n) => n.toLowerCase().includes(q) && !n.toLowerCase().startsWith(q)
    )
    return [...starts, ...inc].slice(0, 5)
  }, [companyNames, searchTerm])

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
            disabled={isLoading || loading}
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
          disabled={!searchTerm || isLoading || loading}
        >
          <Search className="h-4 w-4 mr-2" />
          {buttonLabel}
        </Button>
      </div>
    </div>
  )
}

export default SearchBar
