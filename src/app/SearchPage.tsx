'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import SearchBar from '@/components/SearchBar'

const SearchPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">🏢 기업 재무분석 시스템</h2>
            <p className="text-gray-600">
              2,664개 기업의 2025년 1분기 재무데이터를 분석합니다
            </p>
            <div className="relative max-w-md mx-auto">
              <SearchBar />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SearchPage
