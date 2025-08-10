'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type SearchIndexState = {
  companyNames: string[]
  loading: boolean
  error: string | null
}

const SearchIndexContext = createContext<SearchIndexState>({
  companyNames: [],
  loading: true,
  error: null,
})

export function SearchIndexProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [state, setState] = useState<SearchIndexState>({
    companyNames: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/search', {
          cache: 'no-store',
        })
        if (!res.ok)
          throw new Error(`Failed to load company index: ${res.status}`)
        const data = (await res.json()) as { companyNames: string[] }
        const names = Array.isArray(data.companyNames) ? data.companyNames : []
        if (!mounted) return
        setState({ companyNames: names, loading: false, error: null })
      } catch (e) {
        if (!mounted) return
        const message = e instanceof Error ? e.message : 'Unknown error'
        setState({ companyNames: [], loading: false, error: message })
        console.error('자동완성 인덱스 로드 실패:', message)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <SearchIndexContext.Provider value={state}>
      {children}
    </SearchIndexContext.Provider>
  )
}

export function useSearchIndex() {
  return useContext(SearchIndexContext)
}
